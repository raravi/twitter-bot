const moment = require('moment');
const Sentiment = require('sentiment');
const vader = require('vader-sentiment');
const twit = require('twit');
const dotenv = require('dotenv');
dotenv.config();

(function(root) {
  function TwitterBot() {
    this.unitOfTime = 'hours';
    this.oneUnitOfTime = 60 * 60 * 1000;
    this.numberOfUnitsOfTimeForRetweet = 6;
    this.numberOfUnitsOfTimeForFollow = 6;
    this.intervalForRetweet = this.numberOfUnitsOfTimeForRetweet * this.oneUnitOfTime;
    this.intervalForFollow = this.numberOfUnitsOfTimeForFollow * this.oneUnitOfTime;
    this.selectedTweetForRetweet;
    this.selectedTweetForFollow;

    this.Twitter = new twit({
      consumer_key: process.env.BOT_CONSUMER_KEY,
      consumer_secret: process.env.BOT_CONSUMER_SECRET,
      access_token: process.env.BOT_ACCESS_TOKEN,
      access_token_secret: process.env.BOT_ACCESS_TOKEN_SECRET
    });

    this.paramsForSearch = {
      q: '#100DaysOfCode -filter:retweets',
      result_type: 'recent',
      count: 50,
      lang: 'en'
    };

    this.optionsForSentiment = {
      extras: {
        'learned': 2,
        'learnt': 2,
        'learning': 2,
        'learn': 1
      }
    };

    this.sentiment = new Sentiment();
  }

  TwitterBot.prototype.tweet = function (text) {
    let tweet = {
        status: text
    };

    this.Twitter.post('statuses/update', tweet, (err, data, response) => {
      if (err) {
         console.log(err);
      }
      else {
       console.log('Tweet Posted!');
      }
    });
  };

  TwitterBot.prototype.retweet = function() {
    this.Twitter.get('search/tweets', this.paramsForSearch, (err, data, response) => {
      if (err) {
         console.log(err);
      }
      else {
        let tweets = [];
        console.log('-------------------------------');
        console.log('Tweets returned: ', data.statuses.length);
        console.log('-------------------------------');
        for (let i = 0; i < data.statuses.length; i++) {
          let tweet = data.statuses[i];
          let timeElapsed;
          try {
            timeElapsed = moment().diff(moment(tweet.created_at), this.unitOfTime);
          } catch(e) {
            console.err('Created Time not picked up by Moment.js!');
            timeElapsed = null;
          }
          console.log('tweet.retweeted_status: ', tweet.retweeted_status);
          console.log('tweet.possibly_sensitive: ', tweet.possibly_sensitive);
          if (tweet.retweeted_status === undefined &&
              Number.isInteger(timeElapsed) && timeElapsed < this.numberOfUnitsOfTimeForRetweet &&
              !tweet.possibly_sensitive
            ) {
            let result = this.sentiment.analyze(tweet.text, this.optionsForSentiment);
            const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(tweet.text);
            // console.log(timeElapsed, ' hour(s) ago');
            // console.log('Sentiment: ', result.score);
            console.log('Vader Sentiment: ', intensity);
            // console.log(tweet.text);
            if (intensity.compound > 0.2 )
              tweets.push(tweet);
          }
          console.log('-------------------------------');
        }
        console.log('Length: ', tweets.length);
        if (tweets.length === 0)
          return true;
        this.selectedTweetForRetweet = tweets[Math.random() * tweets.length | 0];
        // console.log(this.selectedTweetForRetweet);
        this.Twitter.post( 'statuses/retweet/:id',
                      { id: this.selectedTweetForRetweet.id_str },
                      (err, data, response) => {
                        if (err) {
                           console.log(err);
                        }
                        else {
                          console.log('Retweeted: ', this.selectedTweetForRetweet.id_str);
                        }
                      });
      }
    });
  };

  TwitterBot.prototype.follow = function () {
    this.Twitter.get('friends/ids', { screen_name: 'amith_raravi' , stringify_ids: true }, (err, data, response) => {
      if (err) {
         console.log(err);
      }
      else {
       let friends = data.ids;
       this.Twitter.get('search/tweets', this.paramsForSearch, (err, data, response) => {
         if (err) {
            console.log(err);
         }
         else {
           let tweets = [];
           console.log('-------------------------------');
           console.log('Tweets returned: ', data.statuses.length);
           console.log('-------------------------------');
           for (let i = 0; i < data.statuses.length; i++) {
             let tweet = data.statuses[i];
             let timeElapsed;
             try {
               timeElapsed = moment().diff(moment(tweet.created_at), this.unitOfTime);
             } catch(e) {
               console.err('Created Time not picked up by Moment.js!');
               timeElapsed = null;
             }
             console.log('tweet.retweeted_status: ', tweet.retweeted_status);
             console.log('tweet.possibly_sensitive: ', tweet.possibly_sensitive);
             if (tweet.retweeted_status === undefined &&
                 friends.includes(tweet.user.id_str) === false &&
                 Number.isInteger(timeElapsed) && timeElapsed < this.numberOfUnitsOfTimeForFollow &&
                 !tweet.possibly_sensitive
               ) {
               let result = this.sentiment.analyze(tweet.text, this.optionsForSentiment);
               const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(tweet.text);
               // console.log(timeElapsed, ' hour(s) ago');
               // console.log('Sentiment: ', result.score);
               console.log('Vader Sentiment: ', intensity);
               console.log('tweet.user.id_str: ', tweet.user.id_str);
               // console.log(tweet.text);
               if (intensity.compound > 0.2 )
                 tweets.push(tweet);
             }
             console.log('-------------------------------');
           }
           console.log('Length: ', tweets.length);
           if (tweets.length === 0)
             return true;
           this.selectedTweetForFollow = tweets[Math.random() * tweets.length | 0];
           // console.log(this.selectedTweetForFollow);
           this.Twitter.post('friendships/create', {user_id: this.selectedTweetForFollow.user.id_str}, (err, res) => {
             if(err){
               console.log(err);
             } else {
               console.log('Followed: @', this.selectedTweetForFollow.user.screen_name);
             }
           });
         }
       });
      }
    });
  };

  TwitterBot.prototype.greetNewFollowers = function() {
    var stream = Twitter.stream('user');
    stream.on('follow', (event) => {
      console.log('Follow Event is running');
      var
        name = event.source.name,
        screenName = event.source.screen_name;
      var tweetTxt = '@' + screenName + ' Thank you for following me!';
      var tweet = {
          status: tweetTxt
      };
      Twitter.post('statuses/update', tweet, (err, data, response) => {
        if(err){
          console.log("Error in Replying");
        }
        else{
          console.log("Gratitude shown successfully");
        }
      });
    });
  };

  let twitterBot = new TwitterBot();
  root.twitterBot = twitterBot;

  console.log('The bot has started...');

  // twitterBot.tweet("Hello World!");
  twitterBot.retweet();
  setInterval(twitterBot.retweet.bind(twitterBot), twitterBot.intervalForRetweet);
  twitterBot.follow();
  setInterval(twitterBot.follow.bind(twitterBot), twitterBot.intervalForFollow);
  // twitterBot.greetNewFollowers();
})(this);
