import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import socketIO from "socket.io-client";
import Peer from "peerjs";

const CONNECTION_ENDPOINT = "http://localhost:3001";

export default function VideoChat() {
  const { roomId } = useParams();
  const socketRef = useRef();
  // arr of {} containing audio and video streams
  const [peers, setPeers] = useState({});
  const [myStream, setMyStream] = useState({
    id: undefined,
    audio: undefined,
    video: undefined,
  });

  useEffect(async () => {
    socketRef.current = socketIO(CONNECTION_ENDPOINT);
    let videoStream, audioStream;
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
    } catch (videoErr) {
      console.log(videoErr);
    }
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    } catch (audioErr) {
      console.log(audioErr);
    }

    // creating 1st person peer
    const peer = new Peer(undefined);
    peer.on("open", (myId) => {
      setMyStream((data) => {
        return {
          ...data,
          id: myId,
          video: videoStream ? videoStream : undefined,
          audio: audioStream ? audioStream : undefined,
        };
      });
      socketRef.current.emit("join-room", { roomId, userId: myId });

      // when new person joins room
      socketRef.current.on("user-connected", (userId) => {
        // call new user
        const outgoingAudioCall = peer.call(userId, audioStream, {
          metadata: { type: "audio", callerId: myId },
        });
        const outgoingVideoCall = peer.call(userId, videoStream, {
          metaData: { type: "video", callerId: myId },
        });
        outgoingAudioCall.on("stream", (otherStream) => {
          setPeers((peers) => {
            const newState = { ...peers };
            if (userId in newState) {
              newState[userId].audio = otherStream;
            } else {
              newState[userId] = {
                id: userId,
                audio: otherStream,
                video: undefined,
              };
            }
            return newState;
          });
        });
        outgoingVideoCall.on("stream", (otherStream) => {
          setPeers((peers) => {
            const newState = { ...peers };
            if (userId in newState) {
              newState[userId].video = otherStream;
            } else {
              newState[userId] = {
                id: userId,
                audio: undefined,
                video: otherstream,
              };
            }
            return newState;
          });
        });
      });
      // to receive a call
      peer.on("call", (incomingCall) => {
        const { callerId, type } = incomingCall.metadata;
        incomingCall.answer(audioStream);
        incomingCall.on("stream", (incomingStream) => {
          const newPeer =
            callerId in peers
              ? peers[callerId]
              : { id: callerId, audio: undefined, video: undefined };
          // determine which type of call
          switch (type) {
            case "audio":
              newPeer.audio = incomingStream;
              break;
            case "video":
              newPeer.video = incomingStream;
          }
          setPeers((peers) => {
            const newState = { ...peers };
            newState[callerId] = newPeer;
            return newState;
          });
        });
      });
    });
  }, []);

  function renderPeerAudios() {
    const peerObjects = Object.keys(peers);
    if (peerObjects.length === 0) return null;
    return peerObjects.map((id) => {
      if (peers[id].audio) {
        return <Audio key={id} stream={peers[id].audio} />;
      }
    });
  }

  function renderPeerVideos() {
    const peerObjects = Object.keys(peers);
    if (peerObjects.length === 0) return null;
    return peerObjects.map((id) => {
      if (peers[id].video) {
        return <Video key={id} stream={peers[id].video} />;
      }
    });
  }
  console.log(peers);
  return (
    <div>
      <div>
        {myStream.audio ? <Audio stream={myStream.audio} /> : null}
        {renderPeerAudios()}
      </div>
      <div>
        {myStream.video ? (
          <Video className="something" stream={myStream.video} />
        ) : null}
        {renderPeerVideos()}
      </div>
    </div>
  );
}

function Video({ stream }) {
  const videoRef = useRef();
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  }, [videoRef.current]);

  return <video ref={videoRef} />;
}

function Audio({ stream }) {
  const audioRef = useRef();
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.play();
    }
  }, [audioRef.current]);
  return <audio ref={audioRef} autoPlay />;
}
