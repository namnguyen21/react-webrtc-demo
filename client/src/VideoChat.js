import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import socketIO from "socket.io-client";
import Peer from "peerjs";

const CONNECTION_ENDPOINT = "http://localhost:3001";

export default function VideoChat() {
  const { roomId } = useParams();
  const [mySignal, setMySignal] = useState();
  const [roomUsers, setRoomUsers] = useState([]);
  const [streams, setStreams] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = socketIO(CONNECTION_ENDPOINT);
    const peer = new Peer(undefined);
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => setStreams((streams) => [...streams, stream]))
      .catch((err) => console.log(err));
    peer.on("open", (data) => {
      setMySignal(data);
      setRoomUsers([...roomUsers, data]);
      socketRef.current.emit("join-room", { userId: data, roomId });
    });

    socketRef.current.on("user-connected", (userId) =>
      setRoomUsers((roomUsers) => [...roomUsers, userId])
    );
  }, []);

  console.log(roomUsers);
  return (
    <div>
      {streams.length ? streams.map((s) => <Video stream={s} />) : null}
    </div>
  );
}

function Video({ stream }) {
  const videoRef = useRef();
  const video = <video ref={videoRef} />;
  videoRef.current.srcObject = stream;
  videoRef.current.play();
  return video;
}
