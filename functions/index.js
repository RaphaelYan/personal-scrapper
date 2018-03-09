const functions = require('firebase-functions');
const admin = require('firebase-admin');
var request = require('request');
var cheerio = require('cheerio');

admin.initializeApp(functions.config().firebase);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.addItem = functions.https.onRequest((req, res) => {

  var url = 'https://www.youtube.com/user/joueurdugrenier/videos';

  request(url, (error, response, html) => {
    if (!error) {
      console.log('cool');

      var $ = cheerio.load(html);
      var titles = [];

      $('.yt-lockup-title').filter(function() {
        var data = $(this);
        var title = data.children().first().text();
        console.log('pwet', title);
        titles.push(title);
      });


      admin.database().ref('/items').push({original: original}).then((snapshot) => {
        return res.send(titles);
      }).catch(res.send);

    } else {
      console.log(error);
      res.send(error);
    }
  });
});
