var express       = require('express');
var fs            = require('fs');
var request       = require('request');
var cheerio       = require('cheerio');
var admin         = require('firebase-admin');

var app           = express();
const bodyParser  = require('body-parser');
var cors = require('cors');

var serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  databaseURL: "https://personal-scrapper.firebaseio.com",
  credential: admin.credential.cert(serviceAccount),
});

app.use(bodyParser.json());
app.use(cors());

function addItem(user, item) {
  if (!user.items.find(i => i.id === item.id)) {
    admin.firestore().collection('items').add({
      id: item.id,
      title: item.title,
      userid: user.uid,
      status: 'scrapped'
    });
  } else {
    console.log("on add pas: existe deja");
  }
}

function scrap(body, user) {
  return new Promise((resolve, reject) => {
    request(body.url, function(error, response, html) {
      if (!error) {
        var $ = cheerio.load(html);

        $('.channels-content-item').filter(function() {
            var data = $(this);
            var title = data.find('.yt-lockup-title').children().first().text();
            var id = data.find('.yt-lockup-video').attr('data-context-item-id');
            id = body.provider + '-' + id;
            addItem(user, {title, userid : user.uid, id: id });
        });
        resolve();
      } else {
        reject(console.log(error));
      }
    });
  });
}

app.post('/scrape', function(req, res) {
  console.log(req.body);
  let userid = req.body.userid;
  let url = req.body.url;
  let user = null;

  console.log('user ' + userid + ' scrapping ' + url);

  admin.auth().getUser(userid).then(function(userRes) {
    console.log("Successfully fetched user data:", userRes.toJSON());
    user = userRes;

    user.items = [];
    admin.firestore().collection('items').where("userid", "==", userid).get().then((querySnapshot) => {

      querySnapshot.forEach(function(doc) {
        console.log(doc.id, " => ", doc.data());
        user.items.push(doc.data());
      });
      console.log("after");
      console.log(user.items);

      scrap(req.body, user).then(() => {
        res.send('blah');
      });
    }).catch(function(error) {
      console.log("Error fetching user data:", error);
    });

  });
})

app.get('/scrape', function(req, res) {

  request("https://www.youtube.com/user/joueurdugrenier/videos", function(error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);
      $('.yt-lockup-title').filter(function() {
          var data = $(this);
          var title = data.children().first().text();
          console.log('pwet', title);
      });
      res.send(html);
    } else {
      console.log(error);
    }
  });
});

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;
