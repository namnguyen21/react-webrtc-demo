import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import socketIO from "socket.io-client";
import Peer from "peerjs";

const CONNECTION_ENDPOINT = "http://localhost:3001";

export default function VideoChat() {
  const { roomId } = useParams();
  const myPeer = useRef();
  const myPeerId = useRef("");
  const socket = useRef();

  const [myAudioStream, setMyAudioStream] = useState();
  const [myVideoStream, setMyVideoStream] = useState();
  const [peerAudioStreams, setPeerAudioStreams] = useState([]);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (!hasJoined) return;
    // only run after we have joined the room
    myPeer.current = new Peer();
    socket.current = socketIO.connect(CONNECTION_ENDPOINT);
    myPeer.current.on("open", (id) => {
      myPeerId.current = id;
      socket.current.emit("join-room", { roomId, userId: id });
    });
    socket.current.on("user-connected", (userId) => {
      console.log(userId);
      const audioCall = myPeer.current.call(userId, myAudioStream);
      audioCall.on("stream", (userStream) => {
        setPeerAudioStreams((streams) => [...streams, userStream]);
      });
    });
    myPeer.current.on("call", (incomingCall) => {
      console.log("getting call");
      incomingCall.answer(myAudioStream);
      incomingCall.on("stream", (userStream) => {
        setPeerAudioStreams((streams) => [...streams, userStream]);
      });
    });
  }, [hasJoined]);

  async function joinCall() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    let hasAudio = false;
    let hasVideo = false;
    console.log(devices);
    devices.forEach((d) => {
      if (d.kind === "audioinput") {
        hasAudio = true;
      }
      if (d.kind === "videoinput") {
        hasVideo = true;
      }
    });
    console.log({ hasAudio, hasVideo });
    try {
      if (hasAudio && hasVideo) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMyAudioStream(new MediaStream(stream.getAudiotracks()));
        setMyVideoStream(new MediaStream(stream.getVideotracks()));
      } else if (hasAudio) {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setMyAudioStream(audioStream);
      } else if (hasVideo) {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setMyVideoStream(videoStream);
      }
    } catch (err) {
      console.log(err);
    }
    setHasJoined(true);
  }
  return (
    <div>
      <button onClick={joinCall}>Join</button>
      <div className="audio-streams">
        {myAudioStream ? <Audio stream={myAudioStream} /> : null}
        {peerAudioStreams.length > 0
          ? peerAudioStreams.map((s, i) => <Audio stream={s} key={i} />)
          : null}
      </div>
      <div>{myVideoStream ? <Video stream={myVideoStream} /> : null}</div>
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
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then((res) => console.log("audio playing"))
          .catch((err) => console.log(err));
      }
    }
  }, [audioRef.current]);
  return <audio ref={audioRef} autoPlay />;
}
