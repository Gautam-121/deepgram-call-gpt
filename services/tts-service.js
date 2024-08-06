require('dotenv').config();
const EventEmitter = require('events');

class TextToSpeechService extends EventEmitter {
  constructor() {
    super();
    this.nextExpectedIndex = 0;
    this.speechBuffer = {}; // An object to store speech data.
  }

  async generate(data, interactionCount) {
    try {
      const { partialResponseIndex, apiReply } = data;
      if(!apiReply?.answer) { return; };
      this.emit('speech', partialResponseIndex, apiReply.audio, apiReply.answer, interactionCount);
    } catch (error) {
      this.emit('error', error);
    }
  }
}

module.exports = { TextToSpeechService };


