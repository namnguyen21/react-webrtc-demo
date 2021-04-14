import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import socketIO from "socket.io-client";
import Peer from "peerjs";

const CONNECTION_ENDPOINT = "http://localhost:3001";

export default function VideoChat() {
  return <div></div>;
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
