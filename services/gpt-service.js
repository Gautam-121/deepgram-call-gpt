const EventEmitter = require('events');
const fetch = require('node-fetch');

const UPLOAD_DELAY_MS = 5000; 
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class GptService extends EventEmitter {
  constructor(websocket) {
    super();
    this.ws = websocket;
    this.userContext = [];
    this.partialResponseIndex = 0;
    this.isProcessing = false;
    this.nextInteraction = null;
    this.streamSid = '';
  }

  setCallSid(callSid) {
    this.userContext.push({ 'role': 'system', 'content': `callSid: ${callSid}` });
  }

  // This is used to identify the stream in communication.
  setStreamSid(streamSid) { 
    this.streamSid = streamSid;
  }

  updateUserContext(name, role, text) {
    if (name !== 'user') {
      this.userContext.push({ 'role': role, 'name': name, 'content': text?.trim() });
    } else {
      this.userContext.push({ 'role': role, 'content': text?.trim() });
    }
  }

  handleApiError() {
    if (this.ws && this.ws.readyState === 1) {
      console.log('Call ended due to API error.'.red);
      // this.ws.close(); // Close the WebSocket connection
    }
  }

  async processInteraction(text, interactionCount) {
    this.isProcessing = true;
    console.log(`Processing interaction ${interactionCount}: ${text}`);

    try {
      const response = await fetch('https://scope-surfex.interactivedemos.io/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: text?.trim() })
      });

      let responseData = await response.json();
      console.log(`API response for interaction ${interactionCount}:`, responseData);


      if (typeof responseData !== "object") {
        this.handleApiError();
        return;
      }

      const gptReply = {
        partialResponseIndex: this.partialResponseIndex,
        apiReply: responseData,
      };

      this.emit('gptreply', gptReply, interactionCount);
      this.partialResponseIndex++;

      this.userContext.push({ 'role': 'assistant', 'content': responseData.answer?.trim() });
      // console.log(`GPT -> user context length: ${this.userContext.length}`.green);

    } catch (error) {
      console.error(`Error: ${error.message}`);
      this.handleApiError();
      return;
    } finally {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay for 2 seconds
      this.isProcessing = false;
      this.nextInteraction = null
    }
  }

  // async completion(text, interactionCount, role = 'user', name = 'user') {
  //   this.updateUserContext(name, role, text);

  //   if (!this.isProcessing) {
  //     await this.processInteraction(text, interactionCount);
  //     // Add a 5-second delay before storing the next interaction
  //     setTimeout(() => {
  //       console.log("Inside the first proccessing" , this.nextInteraction)
  //       if (this.nextInteraction) {
  //         const { text, interactionCount } = this.nextInteraction;
  //         this.nextInteraction = { text, interactionCount };
  //       }
  //     }, 5000);
  //   } else {
  //     console.log(`Storing next interaction ${interactionCount}: ${text}`);
  //     // Delay before storing the next interaction
  //     setTimeout(() => {
  //       this.nextInteraction = { text, interactionCount };
  //     }, 5000);
  //   }
  // }

  async completion(text, interactionCount, role = 'user', name = 'user') {
    this.updateUserContext(name, role, text);
  
    if (!this.isProcessing) {
      await this.processInteraction(text, interactionCount);
    } else {
      console.log(`Storing next interaction ${interactionCount}: ${text}`);
      this.nextInteraction = { text, interactionCount };
    }
  
    // Check for next interaction after current processing is done
    if (this.nextInteraction && !this.isProcessing) {
      const { text, interactionCount } = this.nextInteraction;
      this.nextInteraction = null;
      await this.processInteraction(text, interactionCount);
    }
  }
}

module.exports = { GptService };
