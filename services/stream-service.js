const EventEmitter = require('events');
const uuid = require('uuid');

//StreamService extends EventEmitter, meaning it can emit and listen to events.
class StreamService extends EventEmitter { 
  constructor(websocket) {
    super();
    this.ws = websocket;
    this.expectedAudioIndex = 0;
    this.audioBuffer = {}; 
    this.streamSid = '';
  }

  // This is used to identify the stream in communication.
  setStreamSid (streamSid) {
    this.streamSid = streamSid;
  }

  // buffer: Handles the incoming audio data.
  buffer (index, audio) {
    if(index === null) {
      this.sendAudio(audio);
    } else if(index === this.expectedAudioIndex) {
      this.sendAudio(audio);
      this.expectedAudioIndex++;

      // It then checks if the next expected audio chunk is in the buffer and sends it if available
      while(Object.prototype.hasOwnProperty.call(this.audioBuffer, this.expectedAudioIndex)) {
        const bufferedAudio = this.audioBuffer[this.expectedAudioIndex];
        this.sendAudio(bufferedAudio);
        this.expectedAudioIndex++;
      }
    } else {
      // If the index does not match expectedAudioIndex, it stores the audio in the buffer for later.
      this.audioBuffer[index] = audio;
    }
  }

  // Sends the audio data over the WebSocket connection.
  sendAudio (audio) {

    // Sends a JSON message with the audio payload and streamSid.
    this.ws.send(
      JSON.stringify({
        streamSid: this.streamSid,
        event: 'media',
        media: {
          payload: audio,
        },
      })
    );
    
    const markLabel = uuid.v4();

    // sends a JSON message with a mark event and the markLabel.
    this.ws.send(
      JSON.stringify({
        streamSid: this.streamSid,
        event: 'mark',
        mark: {
          name: markLabel
        }
      })
    );
    // Emits an audiosent event with the markLabel.
    this.emit('audiosent', markLabel);
  }
}

module.exports = {StreamService};