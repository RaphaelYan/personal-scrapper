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

class ScrapperModel {
  constructor(provider, id) {
    this.title = '';
    this.id = provider + '-' + id;
    this.image = '';
    this.userid = '';
    this.provider = provider;
    this.status = 'scrapped';
    this.url = '';
    this.desc = '';
  }
};

const scrapperAddItem = (user, item, timestampIndexed) => {
  if (!user.items.find(i => i.id === item.id)) {
    item.timestamp = timestampIndexed;
    item.userid = user.uid;
    console.log('===== on add =====');
    console.log(item);
    admin.firestore().collection('items').add(Object.assign({}, item));
  } else {
    console.log('===== on add pas: existe deja =====');
  }
}

const parseItems = (html, user, selector, provider, parseInfos) => {
  const $ = cheerio.load(html);

  const items = $(selector);
  let indexes = items.length;
  const now = Date.now();
  items.filter(function() {
    const data = $(this);

    const infos = parseInfos(data);

    const item = new ScrapperModel(provider, infos.url);
    Object.assign(item, infos);
    scrapperAddItem(user, item, now + indexes);
    indexes -= 1;
  });
}

const scrapperExtremeDown = (html, user, provider) => {
  const parseInfos = (data) => {
    const infos = {};
    infos['title'] = data.find('.top-title').text();
    infos['desc'] = data.find('.top-lasttitle').text();
    infos['url'] = 'https://www.extreme-down.im' + data.attr('href');
    infos['image'] = data.find('.img-post').attr('src').replace('.th.', '.');
    return infos;
  };
  parseItems(html, user, '#toparticle .top-last, #Films .top-last, #series .top-last', provider, parseInfos);
}

const scrapperPshiiitScrap = (html, user, provider) => {
  const parseInfos = (data) => {
    const infos = {};
    infos['title'] = data.find('.cp-xl-title').text().trim();
    infos['desc'] = data.find('.mh-excerpt').text().trim().replace('(lire la suite ►)', '');
    infos['url'] = data.find('.cp-xl-title a').attr('href');
    infos['image'] = data.find('.cp-thumb-xl a img').attr('src');
    return infos;
  };
  parseItems(html, user, '#mh_custom_posts-11 .cp-wrap', provider, parseInfos);
}

const scrapperYoutubeScrap = (html, user, provider) => {
  const parseInfos = (data) => {
    const infos = {};
    infos['title'] = data.find('.yt-lockup-title').children().first().text();
    infos['url'] = 'http://www.youtube.com' + data.find('.yt-lockup-title').children().first().attr('href');
    infos['image'] = data.find('.yt-thumb-clip').children().first().attr('src').replace(/hqdefault/i, 'sddefault');
    return infos;
  };
  parseItems(html, user, '.channels-content-item', provider, parseInfos);
}

const scrapperTwitterScrap = (html, user, provider) => {
  const parseInfos = (data) => {
    const infos = {};
    infos['title'] = data.find('.FullNameGroup').children().text().trim() + ' ' + data.find('.tweet-timestamp').text();
    infos['desc'] = data.find('.tweet-text').text();
    infos['url'] = "https://www.twitter.com" + data.find('.tweet-timestamp').attr('href');
    infos['image'] = data.find('.AdaptiveMedia-container img').attr('src');
    return infos;
  };
  parseItems(html, user, '.tweet', provider, parseInfos);
}

const scrapperMamytwinkScrap = (html, user, provider) => {
  const parseInfos = (data) => {
    const infos = {};
    infos['title'] = data.find('.article-titre .h1 a').text().trim();
    infos['desc'] = data.find('.article-entete').text().trim();
    infos['url'] = 'http://www.mamytwink.com' + data.find('.vignette a').attr('href');
    infos['image'] = data.find('.vignette img').attr('src');
    return infos;
  };
  parseItems(html, user, '.article_wrapper', provider, parseInfos);
}

const scrapperScrap = (body, user) => {
  return new Promise((resolve, reject) => {
    request(body.url, (error, response, html) => {
      if (error) {
        return reject(error);
      }
      switch (body.provider) {
        case 'youtube':
          scrapperYoutubeScrap(html, user, body.provider);
        case 'mamytwink':
          scrapperMamytwinkScrap(html, user, body.provider);
        case 'extreme-down':
        scrapperExtremeDown(html, user, body.provider);
        case 'twitter':
          scrapperTwitterScrap(html, user, body.provider);
        case 'pshiiit':
          scrapperPshiiitScrap(html, user, body.provider);
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

  request('https://www.extreme-down.im', (error, response, html) => {
    if (!error) {
      var $ = cheerio.load(html);
      $('#toparticle .top-last').filter(function(index) {
        var data = $(this);
        const infos = {};
        infos['title'] = data.find('.top-title').text();
        infos['url'] = "https://www.extreme-down.im" + data.attr('href');
        infos['id'] = data.find('.yt-lockup-video').attr('data-context-item-id');
        infos['image'] = data.find('.img-post').attr('src');
        console.log('-----');
        console.log(infos);
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
