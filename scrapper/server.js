var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var firebase = require('firebase');
var app     = express();

firebase.initializeApp({
  apiKey: "AIzaSyAg8XBoLICqKK1uPqD6BXgtBb3jswhq7Y8",
  authDomain: "personal-scrapper.firebaseapp.com",
  databaseURL: "https://personal-scrapper.firebaseio.com",
  projectId: "personal-scrapper",
  storageBucket: "personal-scrapper.appspot.com",
  messagingSenderId: "418768715450"
});

app.get('/scrape', function(req, res) {
    var url = 'https://www.youtube.com/user/joueurdugrenier/videos';

    request(url, function(error, response, html) {
        if (!error){
        	console.log('cool');

            var $ = cheerio.load(html);

            $('.yt-lockup-title').filter(function() {
                var data = $(this);
                var title = data.children().first().text();
                console.log('pwet', title);
                firebase.database().ref('/items').push({
                  title: title,
                });
            });

        } else {
        	console.log(error);
        }
	    res.send(html);
    })
})

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;
