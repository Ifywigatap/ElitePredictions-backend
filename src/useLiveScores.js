import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useLiveScores = () => {
  const [scores, setScores] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize the socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket'], // Force websocket for better performance
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to Live Score Socket:', socket.id);
    });

    // Listen for the event emitted by Backend/src/liveScoreEmitter.js
    socket.on('live-score-update', (data) => {
      setScores(data);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return { scores, isConnected };
};