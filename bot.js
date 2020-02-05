var twit = require('twit');
var config = require('./config.js');

var Twitter = new twit(config);

console.log('The bot has started...');

function getTweets() {
  var params = {
    q: '#100DaysOfCode',
    result_type: 'recent',
    count: 50,
    lang: 'en'
  };

  Twitter.get('search/tweets', params, (err, data, response) => {
    var tweets = [];
    for (var i = 0; i < data.statuses.length; i++) {
      if (data.statuses[i].retweeted_status === undefined) {
        //console.log(data.statuses[i].text);
        tweets.push(data.statuses[i]);
      }
    }
    var tweet = tweets[Math.random() * tweets.length | 0];
    console.log(tweet);
    // Twitter.post( 'statuses/retweet/:id',
    //               { id: tweet.id_str },
    //               (err, data, response) => {
    //                 console.log(data);
    //               });
  });
}

function tweet() {
  var tweet = {
      status: 'First tweet from my bot! #twitterbot #testing #nodejs'
  };

  Twitter.post('statuses/update', tweet, (err, data, response) => {
    if (err) {
       console.log(err);
    }
    else {
     console.log('Tweet Posted!');
    }
  });
}

getTweets();
//tweet();
