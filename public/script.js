const socket = io();

const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const messages = document.getElementById('messages');
const imageUpload = document.getElementById('image-upload');
const encryptionKeyInput = document.getElementById('encryption-key');
const setKeyButton = document.getElementById('set-key');
const typingIndicator = document.getElementById('typing-indicator');
const onlineUsers = document.getElementById('online-users');
const emojiButton = document.getElementById('emoji-button');
const emojiPicker = document.querySelector('emoji-picker');

let encryptionKey = '';
let myId = '';
const userColors = {};
let replyingTo = null;

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getInitials(userId) {
    return userId.substr(0, 2).toUpperCase();
}

function encryptMessage(message) {
    return CryptoJS.AES.encrypt(message, encryptionKey).toString();
}

function decryptMessage(encryptedMessage) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedMessage, encryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        return null;
    }
}

function createMessageElement(msg, isImage = false, isMine = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isMine ? 'mine' : 'others'}`;
    messageDiv.id = msg.id;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar';
    avatarDiv.style.backgroundColor = userColors[msg.userId] || getRandomColor();
    avatarDiv.textContent = getInitials(msg.userId);
    messageDiv.appendChild(avatarDiv);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (msg.replyTo) {
        const replyDiv = document.createElement('div');
        replyDiv.className = 'reply-to';
        replyDiv.textContent = `Replying to: ${msg.replyTo.substr(0, 20)}...`;
        contentDiv.appendChild(replyDiv);
    }

    const decryptedContent = decryptMessage(msg.content);

    if (decryptedContent) {
        if (isImage) {
            const img = document.createElement('img');
            img.src = decryptedContent;
            img.className = 'message-image';
            contentDiv.appendChild(img);
        } else {
            const p = document.createElement('p');
            p.textContent = decryptedContent;
            p.className = 'message-text';
            contentDiv.appendChild(p);
        }
    } else {
        const p = document.createElement('p');
        p.textContent = '(Encrypted message)';
        p.className = 'message-text encrypted';
        contentDiv.appendChild(p);
    }

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date(msg.time).toLocaleTimeString();
    contentDiv.appendChild(timeDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    const replyButton = document.createElement('button');
    replyButton.textContent = 'Reply';
    replyButton.onclick = () => setReplyTo(msg);
    actionsDiv.appendChild(replyButton);
    contentDiv.appendChild(actionsDiv);

    messageDiv.appendChild(contentDiv);
    return messageDiv;
}

function setReplyTo(msg) {
    replyingTo = msg;
    input.placeholder = `Replying to: ${decryptMessage(msg.content).substr(0, 20)}...`;
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        const encryptedMessage = encryptMessage(input.value);
        const messageObj = {
            type: 'text',
            content: encryptedMessage,
            userId: myId,
            id: Date.now().toString(),
            time: new Date().toISOString(),
            replyTo: replyingTo ? decryptMessage(replyingTo.content) : null
        };
        socket.emit('chat message', messageObj);
        input.value = '';
        replyingTo = null;
        input.placeholder = 'Type a message...';
    }
});

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const encryptedImage = encryptMessage(event.target.result);
            const messageObj = {
                type: 'image',
                content: encryptedImage,
                userId: myId,
                id: Date.now().toString(),
                time: new Date().toISOString(),
                replyTo: replyingTo ? decryptMessage(replyingTo.content) : null
            };
            socket.emit('chat message', messageObj);
            replyingTo = null;
            input.placeholder = 'Type a message...';
        };
        reader.readAsDataURL(file);
    }
});

setKeyButton.addEventListener('click', () => {
    encryptionKey = encryptionKeyInput.value;
    encryptionKeyInput.value = '';
    alert('Encryption key set successfully!');
});

let typingTimeout = null;
input.addEventListener('input', () => {
    socket.emit('typing', myId);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop typing', myId);
    }, 1000);
});

emojiButton.addEventListener('click', () => {
    const emojiPickerContainer = document.getElementById('emoji-picker-container');
    emojiPickerContainer.style.display = emojiPickerContainer.style.display === 'none' ? 'block' : 'none';
});

emojiPicker.addEventListener('emoji-click', event => {
    input.value += event.detail.unicode;
});

socket.on('connect', () => {
    myId = socket.id;
    userColors[myId] = getRandomColor();
});

socket.on('chat message', (msg) => {
    const messageElement = createMessageElement(msg, msg.type === 'image', msg.userId === myId);
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
});

socket.on('typing', (userId) => {
    if (userId !== myId) {
        typingIndicator.textContent = `${getInitials(userId)} is typing...`;
    }
});

socket.on('stop typing', (userId) => {
    if (userId !== myId) {
        typingIndicator.textContent = '';
    }
});

socket.on('user count', (count) => {
    onlineUsers.textContent = `Online: ${count}`;
});