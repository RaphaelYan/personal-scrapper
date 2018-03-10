const express         = require('express');
const fs              = require('fs');
const request         = require('request');
const cheerio         = require('cheerio');
const admin           = require('firebase-admin');
const bodyParser      = require('body-parser');
const cors            = require('cors');
const serviceAccount  = require('./serviceAccountKey.json');
const app             = express();

admin.initializeApp({
  databaseURL: 'https://personal-scrapper.firebaseio.com',
  credential: admin.credential.cert(serviceAccount),
});

app.use(bodyParser.json());
app.use(cors());

const scrapperAddItem = (user, item) => {
  if (!user.items.find(i => i.id === item.id)) {
    // admin.firestore().collection('items').add(item); // WHY THE FUCK IS THIS NOT WORKING ? Error: Cannot use custom type "undefined" as a Firestore type.
    // but this is ok: ????
    console.log('on add:', item);
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
    console.log('on add pas: existe deja');
  }
}

// c'est possible en js des classes pour faire des interface joli etc ? C'est trop moche ca en javascript serieux :()

const scrapperYoutubeScrap = (html, user) => {
  const $ = cheerio.load(html);

  $('.channels-content-item').filter(function() {
    const data = $(this);
    const title = data.find('.yt-lockup-title').children().first().text();
    const url = data.find('.yt-lockup-title').children().first().attr('href');
    let id = data.find('.yt-lockup-video').attr('data-context-item-id');
    const image = data.find('.yt-thumb-clip').children().first().attr('src').replace(/hqdefault/i, 'sddefault');
    id = 'youtube' + '-' + id;
    const item = { // bouuuuh les interface c'est en typescript. Comment on fait des interface et de l'heritage en js ? :'(
      title: title, id: id, image: image, userid: user.id, provider: 'youtube', status: 'scrapped', url: url
    }
    scrapperAddItem(user, item);
  });
}

const scrapperMamytwinkScrap = (html, user) => {
  const $ = cheerio.load(html);

  $('.article_wrapper').filter(function() {
    const data = $(this);
    const title = data.find('.article-titre .h1 a').text().trim();
    const date = data.find('meta').attr('content');
    const desc = data.find('.article-entete').text().trim();
    const image = data.find('.vignette img').attr('src');
    const url = data.find('.vignette a').attr('href');
    const id = 'mamytwink-' + url;
    const item = { // bouuuuh
      title: title, id: id, image: image, userid: user.id, provider: 'mamytwink', status: 'scrapped', url: url, date: date
    }
    scrapperAddItem(user, item);
  });
}

const scrapperScrap = (body, user) => {
  return new Promise((resolve, reject) => {
    request(body.url, (error, response, html) => {
      if (error) {
        return reject(error);
      }
      switch (body.provider) {
        case 'youtube':
          scrapperYoutubeScrap(html, user);
        case 'mamytwink':
          scrapperMamytwinkScrap(html, user);
      }
      resolve();
    });
  });
}

const scrapperRetrieveUserItems = (req, user) => {
  return new Promise((resolve, reject) => {
    admin.firestore()
    .collection('items')
    .where('userid', '==', req.body.userid)
    .get()
    .then((querySnapshot) => {
      user.items = [];
      querySnapshot.forEach((doc) => {
        user.items.push(doc.data());
      });

      scrapperScrap(req.body, user)
      .then(resolve).catch(reject);
    }).catch(reject);
  });
}

const scrapperGetUserAndScrap = (req) => {
  return new Promise((resolve, reject) => {
    admin.auth().getUser(req.body.userid).then((user) => {
      // console.log('Successfully fetched user data:', userRes.toJSON());
      scrapperRetrieveUserItems(req, user)
      .then(resolve).catch(reject);
    }).catch(reject);
  });
}

app.post('/scrape', (req, res) => {
  // console.log(req.body);
  let user = null;

  // console.log('user ' + userid + ' scrapping ' + url);
  scrapperGetUserAndScrap(req)
  .then(() => {
    res.send('OK');
  })
  .catch((error) => {
    console.log('Error in /scrape:', error);
  });
});








// this function is for tests
app.get('/scrape', (req, res) => {

  request('https://www.mamytwink.com/', (error, response, html) => {
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
        console.log('-----');
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
