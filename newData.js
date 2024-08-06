const fs = require('fs');

// Base64 string (truncated for brevity)
const base64String = '';

// Decode base64 string to binary
const binaryData = Buffer.from(base64String, 'base64');

// Save binary data to a file to inspect (optional)
fs.writeFileSync('decoded_audio.bin', binaryData);

// Inspect the first few bytes of the binary data
const header = binaryData.slice(0, 20); // Get first 20 bytes
console.log('Header:', header);
console.log('Header (Hex):', header.toString('hex'));

// Analyze header to identify the format
function analyzeHeader(header) {
    const hexHeader = header.toString('hex');
    if (hexHeader.startsWith('52494646')) {
        console.log('This is likely a WAV file.');
    } else if (hexHeader.startsWith('2321414d52')) {
        console.log('This is likely an AMR file.');
    } else {
        console.log('Unknown format.');
    }
}

analyzeHeader(header);
