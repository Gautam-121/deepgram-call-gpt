/*
  You can use this script to place an outbound call
  to your own mobile phone.
*/

require('dotenv').config();

async function makeOutBoundCall() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  const client = require('twilio')(accountSid, authToken);

  console.log(`https://${process.env.SERVER}/incoming`)
  console.log(process.env.TO_NUMBER)
  console.log(process.env.FROM_NUMBER)

  await client.calls
    .create({
      url: `https://${process.env.SERVER}/incoming`,
      to: process.env.TO_NUMBER,
      from: process.env.FROM_NUMBER
    })
    .then(call => console.log(call.sid));
}

makeOutBoundCall();