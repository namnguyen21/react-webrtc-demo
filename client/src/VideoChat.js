import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import socketIO from "socket.io-client";
import Peer from "peerjs";

const CONNECTION_ENDPOINT = "http://localhost:3001";

export default function VideoChat() {
  const { roomId } = useParams();
  const [mySignal, setMySignal] = useState();
  const [myStream, setMyStream] = useState();
  const [roomUsers, setRoomUsers] = useState([]);
  const [streams, setStreams] = useState([]);
  const socketRef = useRef();

  useEffect(async () => {
    socketRef.current = await socketIO(CONNECTION_ENDPOINT);
    const peer = new Peer(undefined);
    await navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setMyStream(stream);
        setStreams((streams) => [...streams, stream]);
        socketRef.current.on("user-connected", (userId) => {
          setRoomUsers((roomUsers) => [...roomUsers, userId]);
          const call = peer.call(userId, stream);
          call.on("stream", (otherUserStream) => {
            setStreams((streams) => [...streams, otherUserStream]);
          });
        });
        peer.on("call", (call) => {
          call.answer(stream);
          call.on("stream", (otherUserStream) => {
            setStreams((streams) => [...streams, otherUserStream]);
          });
        });
      })
      .catch((err) => console.log(err));
    peer.on("open", (data) => {
      setMySignal(data);
      setRoomUsers([...roomUsers, data]);
      socketRef.current.emit("join-room", { userId: data, roomId });
    });
  }, []);

  console.log(roomUsers);
  return (
    <div>
      {streams.length
        ? streams.map((s, i) => <Video stream={s} key={i} />)
        : null}
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
