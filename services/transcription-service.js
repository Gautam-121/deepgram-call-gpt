require('colors');
const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk');
const { Buffer } = require('node:buffer');
const EventEmitter = require('events');

class TranscriptionService extends EventEmitter {
  constructor() {
    super();
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    this.dgConnection = deepgram.listen.live({
      encoding: 'mulaw', 
      sample_rate: '8000',
      model: 'nova-2',
      language:"hi",
      punctuate: true,
      interim_results: true,
      endpointing: 200,
      utterance_end_ms: 1000
    });

    this.finalResult = '';
    this.speechFinal = false;
    this.timer = null;

    this.dgConnection.on(LiveTranscriptionEvents.Open, () => {
      this.dgConnection.on(LiveTranscriptionEvents.Transcript, (transcriptionEvent) => {
        const alternatives = transcriptionEvent.channel?.alternatives;
        let newText = '';
        if (alternatives) {
          newText = alternatives[0]?.transcript || '';
        }

        if (transcriptionEvent.type === 'UtteranceEnd') {
          if (this.finalResult.trim().length > 0) {
            console.log(`UtteranceEnd received, emitting current text: ${this.finalResult}`.yellow);
            this.emit('transcription', this.finalResult.trim());
            this.finalResult = '';
            this.speechFinal = false;  // Reset speechFinal
            clearTimeout(this.timer);
          }
          return;
        }

        if (transcriptionEvent.is_final && newText.trim()?.length > 0) {
          this.finalResult += newText;
          
          if (transcriptionEvent.speech_final) {
            console.log(`Speech final received, emitting: ${this.finalResult}`.yellow);
            this.emit('transcription', this.finalResult.trim());
            this.finalResult = '';
            this.speechFinal = false;  // Reset speechFinal
            clearTimeout(this.timer);
          } else {
            this.speechFinal = false;
            this.resetTimer();
          }
        } else {
          // Handle interim results
          this.emit('utterance', newText);
        }
      });

      this.dgConnection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error('STT -> deepgram error');
        console.error(error);
      });

      this.dgConnection.on(LiveTranscriptionEvents.Warning, (warning) => {
        console.error('STT -> deepgram warning');
        console.error(warning);
      });

      this.dgConnection.on(LiveTranscriptionEvents.Metadata, (metadata) => {
        console.error('STT -> deepgram metadata');
        console.error(metadata);
      });

      this.dgConnection.on(LiveTranscriptionEvents.Close, () => {
        console.log('STT -> Deepgram connection closed'.yellow);
      });
    });
  }

  resetTimer() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.finalResult.trim().length > 0) {
        console.log(`Timer expired, emitting: ${this.finalResult}`.yellow);
        this.emit('transcription', this.finalResult.trim());
        this.finalResult = '';
        this.speechFinal = false;  // Reset speechFinal
      }
    }, 2000);
  }

  /**
   * Send the payload to Deepgram
   * @param {String} payload A base64 MULAW/8000 audio stream
   */
  send(payload) {
    if (this.dgConnection.getReadyState() === 1) {
      this.dgConnection.send(Buffer.from(`${payload}`, 'base64'));
    }
  }
}

module.exports = { TranscriptionService };