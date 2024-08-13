const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let userCount = 0;

io.on('connection', (socket) => {
    console.log('A user connected');
    userCount++;
    io.emit('user count', userCount);

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('typing', (userId) => {
        socket.broadcast.emit('typing', userId);
    });

    socket.on('stop typing', (userId) => {
        socket.broadcast.emit('stop typing', userId);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        userCount--;
        io.emit('user count', userCount);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});