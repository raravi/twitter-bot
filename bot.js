const moment = require('moment');
const Sentiment = require('sentiment');
const vader = require('vader-sentiment');
const twit = require('twit');
const dotenv = require('dotenv');

const interval = 6 * 60 * 60 * 1000;

dotenv.config();

const Twitter = new twit({
  consumer_key: process.env.BOT_CONSUMER_KEY,
  consumer_secret: process.env.BOT_CONSUMER_SECRET,
  access_token: process.env.BOT_ACCESS_TOKEN,
  access_token_secret: process.env.BOT_ACCESS_TOKEN_SECRET
});

console.log('The bot has started...');

function retweet() {
  let params = {
    q: '#100DaysOfCode',
    result_type: 'recent',
    count: 50,
    lang: 'en'
  };
  let optionsForSentiment = {
    extras: {
      'learned': 2,
      'learnt': 2,
      'learning': 2,
      'learn': 1
    }
  };
  let sentiment = new Sentiment();

  Twitter.get('search/tweets', params, (err, data, response) => {
    let tweets = [];
    console.log('-------------------------------');
    for (let i = 0; i < data.statuses.length; i++) {
      let tweet = data.statuses[i];
      let timeElapsed;
      try {
        timeElapsed = moment().diff(moment(tweet.created_at), 'hours');
      } catch(e) {
        console.err('Created Time not picked up by Moment.js!');
        timeElapsed = null;
      }
      if (tweet.retweeted_status === undefined &&
          timeElapsed && timeElapsed < 6 &&
          //(tweet.possibly_sensitive === undefined || tweet.possibly_sensitive === false)
          !tweet.possibly_sensitive
        ) {
        let result = sentiment.analyze(tweet.text, optionsForSentiment);
        const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(tweet.text);
        console.log(timeElapsed, ' hour(s) ago');
        console.log('Sentiment: ', result);
        console.log('Vader Sentiment: ', intensity);
        console.log(tweet.text);
        console.log(tweet.possibly_sensitive);
        console.log('-------------------------------');
        if (intensity.compound > 0.2 )
          tweets.push(tweet);
      }
    }
    console.log('Length: ', tweets.length);
    if (tweets.length === 0)
      return true;
    let selectedTweet = tweets[Math.random() * tweets.length | 0];
    console.log(selectedTweet);
    // Twitter.post( 'statuses/retweet/:id',
    //               { id: selectedTweet.id_str },
    //               (err, data, response) => {
    //                 console.log(data);
    //               });
  });
}

function tweet() {
  let tweet = {
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

retweet(); // Runs on first load
setInterval(retweet, interval); // Retweets every 6 hours
//tweet();
