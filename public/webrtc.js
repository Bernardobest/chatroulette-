const localVideo = document.createElement('video');
localVideo.autoplay = true;
localVideo.muted = true;
localVideo.className = 'local-video';
document.body.appendChild(localVideo);

let localStream;
let peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

function waitForSocketAndInit() {
  if (!window.ws || window.ws.readyState !== WebSocket.OPEN) {
    return setTimeout(waitForSocketAndInit, 100); // Attendre 100ms et réessayer
  }

  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
    setupPeerConnection();

    window.ws.addEventListener("message", handleSignalingData);
  }).catch(err => {
    alert("Erreur d'accès caméra/micro : " + err.message);
  });
}

function handleSignalingData(event) {
  try {
    const data = JSON.parse(event.data);

    if (data.type === "offer") {
      peerConnection = new RTCPeerConnection(config);
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
        }
      };

      peerConnection.ontrack = event => {
        const remoteVideo = document.createElement('video');
        remoteVideo.srcObject = event.streams[0];
        remoteVideo.autoplay = true;
        remoteVideo.className = 'remote-video';
        document.body.appendChild(remoteVideo);
      };

      peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() =>
        peerConnection.createAnswer()
      ).then(answer => {
        return peerConnection.setLocalDescription(answer);
      }).then(() => {
        ws.send(JSON.stringify({ type: "answer", sdp: peerConnection.localDescription }));
      });
    } else if (data.type === "answer") {
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (data.type === "ice-candidate") {
      peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  } catch (e) {
    // Ignore les messages texte classiques
  }
}

function setupPeerConnection() {
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate }));
    }
  };

  peerConnection.ontrack = event => {
    const remoteVideo = document.createElement('video');
    remoteVideo.srcObject = event.streams[0];
    remoteVideo.autoplay = true;
    remoteVideo.className = 'remote-video';
    document.body.appendChild(remoteVideo);
  };

  peerConnection.createOffer().then(offer =>
    peerConnection.setLocalDescription(offer)
  ).then(() => {
    ws.send(JSON.stringify({ type: "offer", sdp: peerConnection.localDescription }));
  });
}

// Lancer dès que possible
waitForSocketAndInit();
