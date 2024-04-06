const { Aki } = require('aki-api');

module.exports = {
  config: {
    name: "شخصية",
    version: "1.0",
    author: "لوفي ٢",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "",
      en: "شخصية مشهورة ✨"
    },
    longDescription: {
      vi: "",
      en: "لعبة شخصية مشهورة فكر ب شخصية مشهورة"
    },
    category: "العاب",
    guide: {
      en: "فقض فكر ب شخصية مشهورة و كتب {prefix}شخصية و أجب ب ( نعم ، لا ، ربما ، لا أعرف ، ربما لا )"
    },
    envConfig: {
      reward: 25
    }
  },

  onStart: async function ({ message, event, commandName }) {
    try {
      const region = 'ar';
      const aki = new Aki({ region });
      await aki.start();

      const question = aki.question;
      const answers = aki.answers;

      const timeout = 4000 * 1000;

      message.reply({
        body: question
      }, (err, info) => {
        if (err) {
          console.error("خطأ في استلام السؤال :", err);
          return;
        }

        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: event.senderID,
          aki: aki // Store the Akinator instance along with the reply info
        });

        // Set a timeout for 40 seconds to delete the question and send the answer
        setTimeout(async () => {
          if (global.GoatBot.onReply.has(info.messageID)) {
            global.GoatBot.onReply.delete(info.messageID);

            await aki.win();

            const firstGuess = aki.answers[0];
            const guessCount = aki.guessCount;

            message.send({
              body: `إنتهى وقت التخمين \n\nFir: ${firstGuess.name}\nالوصف : ${firstGuess.description}\n\nعدد التخمينات : ${guessCount}`
            });
          }
        }, timeout);
      });
    } catch (err) {
      console.error("خطاء في استلام السؤال :", err);
      message.reply("خطاء غير متوقع جرب الأمر لاحقا.");
    }
  },

  onReply: async function ({ message, event, Reply }) {
    const { messageID, aki } = Reply;
    const userAnswer = event.body.trim();

    // Map Arabic responses to their corresponding answer options
    const arabicResponses = {
      'نعم': 0,
      'لا': 1,
      'ربما': 2,
      "لا أعرف": 3,
      'ربما لا': 4
    };

    // Check if the user's answer is valid
    if (arabicResponses.hasOwnProperty(userAnswer)) {
      const akiAnswer = arabicResponses[userAnswer];

      await aki.step(akiAnswer);

      if (aki.progress >= 70 || aki.currentStep >= 78) {
        await aki.win();

        const firstGuess = aki.answers[0];
        const guessCount = aki.guessCount;
        const pictureURL = firstGuess.absolute_picture_path;

        message.send({
          body: `✨✨✨✨✨✨✨✨✨\n\n إجابتك : ${userAnswer} 🌟\n\n الشخصية : ${firstGuess.name} 🤍\nالوصف : ${firstGuess.description} 🖤\n\n عدد التخمينات : ${guessCount} `, attachment: await global.utils.getStreamFromURL(pictureURL)
        });

        global.GoatBot.onReply.delete(messageID);
      } else {
        const question = aki.question;
        const answers = aki.answers;

        message.send({
          body: question
        }, (err, info) => {
          if (err) {
            console.error("خطاء في إستلام السؤال :", err);
            return;
          }

          global.GoatBot.onReply.set(info.messageID, {
            commandName: Reply.commandName,
            messageID: info.messageID,
            author: event.senderID,
            aki: aki // Store the Akinator instance along with the reply info
          });
        });
      }
    } else {
      // Handle invalid answer
      message.send({
        body: "الرجاء الإجابة عن السؤال ب ( نعم ، لا ، ربما ، لا أعرف ، ربما لا )."
      });
    }
  }
};