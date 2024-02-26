const openai = require('./config/open-ai.js');
const readlineSync = require('readline-sync');
const colors = require('colors');
const player = require('play-sound');
const gtts = require('gtts');

async function speak(text) {
  if (!text || text.trim() === '') {
    console.error(colors.red('Error: No text to speak'));
    return;
  }

  const outputPath = 'C:\\Users\\herna\\OneDrive\\Desktop\\Anitaweb-main\\gtts_output.mp3';
  const gttsSpeech = new gtts(text, 'en');

  try {
    await gttsSpeech.save(outputPath);
    console.log('Audio file generated successfully:', outputPath);

    const audioPlayer = player();
    audioPlayer.play(outputPath, (err) => {
      if (err) {
        console.error(colors.red(`Error playing audio: ${err}`));
      }
    });
  } catch (error) {
    console.error(colors.red(`Error saving audio: ${error}`));
  }
}



async function makeOpenAIRequest(messages) {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages,
      });

      return completion.data.choices[0].message.content;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        const delay = Math.pow(2, retries) * 1000;
        console.log(`Rate limited. Retrying after ${delay / 1000} seconds.`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries reached. Unable to complete request.');
}

async function main() {
  console.log(colors.bold.green('Welcome to the Chatbot Program!'));
  console.log(colors.bold.green('You can start chatting with the bot.'));

  const chatHistory = [];

  while (true) {
    const userInput = readlineSync.question(colors.yellow('You: '));

    try {
      const messages = chatHistory.map(([role, content]) => ({
        role,
        content,
      }));

      messages.push({ role: 'user', content: userInput });

      const completionText = await makeOpenAIRequest(messages);

      if (!completionText || completionText.trim() === '') {
        console.error(colors.red('Error: No text to speak'));
      } else {
        console.log(colors.green('Anita: ') + completionText);
        await speak(completionText); // Add "await" to ensure the audio is played after generation
        chatHistory.push(['user', userInput]);
        chatHistory.push(['assistant', completionText]);
      }

      if (userInput.toLowerCase() === 'exit') {
        return;
      }
    } catch (error) {
      console.error(colors.red(error));
    }
  }
}

main();
