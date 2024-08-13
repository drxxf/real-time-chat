importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');

let encryptionKey = '';

self.addEventListener('message', function(e) {
  const { action, data, key } = e.data;
  
  if (action === 'setKey') {
    encryptionKey = key;
    return;
  }

  let result;
  if (action === 'encrypt') {
    result = CryptoJS.AES.encrypt(data, encryptionKey).toString();
  } else if (action === 'decrypt') {
    try {
      const bytes = CryptoJS.AES.decrypt(data, encryptionKey);
      result = bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      result = null;
    }
  }

  self.postMessage({ id: e.data.id, result });
});