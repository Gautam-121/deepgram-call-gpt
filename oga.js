const fs = require('fs');
const path = require('path');

/**
 * Save a base64-encoded audio string to a file in OGG format.
 * @param {String} base64String - The base64-encoded audio data.
 * @param {String} outputPath - The path where the OGG file will be saved.
 */
function saveBase64ToOgg(base64String, outputPath) {
  // Decode the base64 string
  const audioData = Buffer.from(base64String, 'base64');

  // Write the decoded data to a file
  fs.writeFile(outputPath, audioData, (err) => {
    if (err) {
      console.error('Error saving the OGG file:', err);
    } else {
      console.log('OGG file saved successfully:', outputPath);
    }
  });
}

// Example usage
const base64Audio = '';
const outputPath = path.join('C:', 'Users', '1', 'AppData', 'Local', 'Temp', 'a575b688-e53a-4001-8c5e-62553233b8d9.wav');

// Save the base64-encoded audio to an OGG file
saveBase64ToOgg(base64Audio, outputPath);
