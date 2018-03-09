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
    // admin.firestore().collection('items').add(item); // WHY THE FUCK IS THIS NOT WORKING ? Error: Cannot use custom type "undefined" as a Firestore type.
    // but this is ok: ????
    admin.firestore().collection('items').add({
      id: item.id,
      title: item.title,
      userid: user.uid,
      status: 'scrapped',
      image: item.image,
      provider: item.provider,
      url: item.url
    });
  } else {
    console.log("on add pas: existe deja");
  }
}

// c'est possible en js des classes pour faire des interface joli etc ? C'est trop moche ca en javascript serieux :()

function youtubeScrap(html, user) {
  var $ = cheerio.load(html);

  $('.channels-content-item').filter(function() {
    var data = $(this);
    var title = data.find('.yt-lockup-title').children().first().text();
    let url = data.find('.yt-lockup-title').children().first().attr('href');
    var id = data.find('.yt-lockup-video').attr('data-context-item-id');
    var image = data.find('.yt-thumb-clip').children().first().attr('src').replace(/hqdefault/i, 'sddefault');;
    id = 'youtube' + '-' + id;
    let item = { // bouuuuh les interface c'est en typescript. Comment on fait des interface et de l'heritage en js ? :'(
      title: title, id: id, image: image, userid: user.id, provider: 'youtube', status: 'scrapped', url: url
    }
    console.log("image", image);
    addItem(user, item);
  });
}

function mamytwinkScrap(html, user) {
  var $ = cheerio.load(html);

  $('.article_wrapper').filter(function() {
    var data = $(this);
    let title = data.find('.article-titre .h1 a').text().trim();
    let date = data.find('meta').attr('content');
    let desc = data.find('.article-entete').text().trim();
    let image = data.find('.vignette img').attr('src');
    let url = data.find('.vignette a').attr('href');
    let id = 'mamytwink-' + url;
    let item = { // bouuuuh
      title: title, id: id, image: image, userid: user.id, provider: 'mamytwink', status: 'scrapped', url: url, date: date
    }
    addItem(user, item);
  });
}

function scrap(body, user) {
  return new Promise((resolve, reject) => {
    request(body.url, function(error, response, html) {
      if (!error) {
        switch(body.provider) {
          case 'youtube':
            youtubeScrap(html, user);
          case 'mamytwink':
            mamytwinkScrap(html, user);
        }
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

  request("https://www.mamytwink.com/", function(error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);
      $('.article_wrapper').filter(function() {
        var data = $(this);
        let title = data.find('.article-titre .h1 a').text().trim();
        let date = data.find('meta').attr('content');
        let desc = data.find('.article-entete').text().trim();
        let image = data.find('.vignette img').attr('src');
        let url = data.find('.vignette a').attr('href');
        let id = 'mamytwink-' + url;
        console.log("-----");
        console.log(title);
        console.log(date);
        console.log(image);
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
