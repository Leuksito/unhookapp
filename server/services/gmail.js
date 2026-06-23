const { google } = require('googleapis');

async function getMessagesWithBackoff(gmail, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await gmail.users.messages.list(params);
    } catch (error) {
      if (error.code === 429 || error.code === 503) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

async function getMessageDetailsWithBackoff(gmail, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await gmail.users.messages.get(params);
    } catch (error) {
      if (error.code === 429 || error.code === 503) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded for message get');
}

module.exports = {
  getMessagesWithBackoff,
  getMessageDetailsWithBackoff
};
