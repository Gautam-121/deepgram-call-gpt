const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { Readable, Writable } = require('stream');
const fs = require('fs')

ffmpeg.setFfmpegPath(ffmpegPath);



async function saveBase64ToFile(base64String, filename) {
    try {
      fs.writeFile(filename, base64String, 'utf8');
      console.log(`Successfully saved to ${filename}`);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }

// Usage example
async function example() {
  try {
    const oggBase64 = '';
    const mulawBase64 = await convertOggToMulaw(oggBase64);
    // Save the converted base64 to a file
    const filename = 'converted_mulaw.txt';
    await saveBase64ToFile(mulawBase64, filename);
    
    console.log('Conversion and save process completed');
  } catch (error) {
    console.error('Conversion error:', error);
  }
}

example()