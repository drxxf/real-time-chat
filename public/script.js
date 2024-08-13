const socket = io();

const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const messages = document.getElementById('messages');
const imageUpload = document.getElementById('image-upload');
const encryptionKeyInput = document.getElementById('encryption-key');
const setKeyButton = document.getElementById('set-key');

let encryptionKey = '';
let myId = '';
const userColors = {};

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

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar';
    avatarDiv.style.backgroundColor = userColors[msg.userId] || getRandomColor();
    avatarDiv.textContent = getInitials(msg.userId);
    messageDiv.appendChild(avatarDiv);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

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

    messageDiv.appendChild(contentDiv);
    return messageDiv;
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        const encryptedMessage = encryptMessage(input.value);
        socket.emit('chat message', { type: 'text', content: encryptedMessage, userId: myId });
        input.value = '';
    }
});

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Image = event.target.result;
            const encryptedImage = encryptMessage(base64Image);
            socket.emit('chat message', { type: 'image', content: encryptedImage, userId: myId });
        };
        reader.readAsDataURL(file);
    }
});

setKeyButton.addEventListener('click', () => {
    encryptionKey = encryptionKeyInput.value;
    encryptionKeyInput.value = '';
    alert('Encryption key set successfully!');
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