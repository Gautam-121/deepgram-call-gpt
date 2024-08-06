require('dotenv').config();
require('colors');
const express = require('express');
const ExpressWs = require('express-ws');
const { GptService } = require('./services/gpt-service');
const { StreamService } = require('./services/stream-service');
const { TranscriptionService } = require('./services/transcription-service');
const { TextToSpeechService } = require('./services/tts-service');
const { recordingService } = require('./services/recording-service');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const app = express();
ExpressWs(app);
const PORT = process.env.PORT || 3000;

app.post('/incoming', (req, res) => {
  try {
    const response = new VoiceResponse();
    const connect = response.connect();
    connect.stream({ url: `wss://${process.env.SERVER}/connection`});
  
    res.type('text/xml');
    res.end(response.toString());
  } catch (err) {
    console.log(err);
  }
});

/*
  this establishes a WebSocket connection at the /connection endpoint and logs any
   errors that occur.
*/
app.ws('/connection', (ws) => {
  try {
    ws.on('error', console.error);

    let streamSid;
    let callSid;

    const gptService = new GptService(ws);
    const streamService = new StreamService(ws);
    const transcriptionService = new TranscriptionService();
    const ttsService = new TextToSpeechService({});
  
    let marks = [];
    let interactionCount = 0;
  
    // Incoming from MediaStream Handling Incoming WebSocket Messages
    ws.on('message', async function message(data) {
      try {
        const msg = JSON.parse(data);
        if (msg.event === 'start') {

          streamSid = msg.start.streamSid;
          callSid = msg.start.callSid;

          console.log(streamSid)

          streamService.setStreamSid(streamSid);
          gptService.setStreamSid(streamSid)
          gptService.setCallSid(callSid);
  
      try {
        const response = await fetch(
          `https://scope-surfex.interactivedemos.io/process`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: "hello" }),
          }
        );

        let data = await response.json();

        if (typeof data !== "string") {
          // Start recording if the response is successful
          await recordingService(ttsService, callSid);
          console.log(`Twilio -> Starting Media Stream for ${streamSid}`.underline.red);
          ttsService.generate({ partialResponseIndex: null, apiReply: data }, 0);

        } 
        else {
          console.log('Call ended due to API error.'.red);
          // ws.close(); // Close the WebSocket connection
        }
      } catch (error) {
        console.log('Call ended due to API error.'.red);
        // ws.close(); // Close the WebSocket connection
      }
        } 
        else if (msg.event === 'media') {
          // media: Sends the audio payload to the transcription service for processing.
          transcriptionService.send(msg.media.payload);
        } 
        else if (msg.event === 'mark') {
          // mark: Logs and handles audio completion marks.
          const label = msg.mark.name;
          console.log(`Twilio -> Audio completed mark (${msg.sequenceNumber}): ${label}`.red);
          marks = marks.filter(m => m !== msg.mark.name);
        } 
        else if (msg.event === 'stop') {
          // stop: Logs the end of the media stream.
          console.log(`Twilio -> Media stream ${streamSid} ended.`.underline.red);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.close(); // Close the WebSocket connection
      }
    });

    // Handling Transcription Service Events , utterance: Clears the stream if there are interruptions 
    transcriptionService.on('utterance', async (text) => {
      // This is a bit of a hack to filter out empty utterances
      console.log("markes--->" , marks , "length--->" , marks.length , "text--->",  text.length)
      if(marks.length > 0 && text?.length > 2) {
        console.log('Twilio -> Interruption, Clearing stream'.red);
        ws.send(
          JSON.stringify({
            streamSid,
            event: 'clear',
          })
        );
        // gptService.completion(text, interactionCount);
        // interactionCount += 1;
      }
    });

    transcriptionService.on('transcription', async (text) => {
      if (!text) { return };
      console.log(`Interaction ${interactionCount} – STT -> GPT: ${text}`.yellow);
      gptService.completion(text, interactionCount);
      interactionCount += 1;
    });

    gptService.on('gptreply', async (gptReply, icount) => {
        console.log(`Interaction ${icount}: GPT -> TTS: ${gptReply.apiReply.answer}`.green);
        ttsService.generate(gptReply, icount);
    });

    // Handling Text-to-Speech Service Events
    ttsService.on('speech', (responseIndex, audio, label, icount) => {
      console.log(`Interaction ${icount}: TTS -> TWILIO: ${label}`.blue);
      streamService.buffer(responseIndex, audio);
    });

    // Handling Stream Service Events
    streamService.on('audiosent', (markLabel) => {
      marks.push(markLabel);
    });
  } catch (err) {
    console.log(err);
  }
});

app.listen(PORT);
console.log(`Server running on port ${PORT}`);

