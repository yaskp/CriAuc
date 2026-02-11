import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    timeout: 10000,
    transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log('✅ Socket Connected:', socket.id);
});

socket.on('disconnect', () => {
    console.log('❌ Socket Disconnected');
});

socket.on('connect_error', (error) => {
    console.error('🔴 Connection Error:', error.message);
});

export default socket;
