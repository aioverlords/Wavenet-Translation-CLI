// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');
var {
  Translate
} = require('@google-cloud/translate').v2;
const fs = require('fs');
const util = require('util');
var player = require('play-sound')(opts = {});
const prompt = require('prompt');


async function translate(phrase) {

  // Construct the request
  var request = {
    input: {
      text: phrase
    },
    // Select the language and SSML voice gender (optional)
    voice: {
      languageCode: target,
      ssmlGender: 'MALE',
      name: "en-US-Wavenet-D"
    },
    // select the type of audio encoding
    audioConfig: {
      effectsProfileId: [
        "headphone-class-device"
      ],
      pitch: -4,
      speakingRate: 0.95,
      audioEncoding: "MP3"
    },
  };

  if (target != "en-US") {

    var translate = new Translate();
    console.log(target);

    let [translations] = await translate.translate(phrase, target);
    translations = Array.isArray(translations) ? translations : [translations];
    console.log('Translations:');
    console.log(translations);

    request.voice.name = target;
    request.input.text = translations;
  }

  const client = new textToSpeech.TextToSpeechClient();
  const [response] = await client.synthesizeSpeech(request);
 

  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  await writeFile('response.mp3', response.audioContent, 'binary');


  player.play('response.mp3', function (err) {
    if (err) throw err

    promptMe();

  })

}


var languages = JSON.parse(fs.readFileSync('languages.json'));
var target = "en-US";


async function promptMe() {

  prompt.get(['phrase'], function (err, result) {
    if (err) {
      return onErr(err);
    }

    if (/language: /gi.test(result.phrase)) {

      console.log("changing language");

      (async function () {

        var target_language = result.phrase.replace(/language:\s*/gi, "").toLowerCase();
        console.log("Target Language: " + target_language);
        target = languages[target_language][0];
        console.log(target);

        promptMe();
      }());

    } else {

      console.log(result.phrase);
      translate(result.phrase);
    }

  });

  function onErr(err) {
    console.log(err);
    return 1;
  }

};

promptMe();