const moment = require('moment');
const Sentiment = require('sentiment');
const vader = require('vader-sentiment');
const twit = require('twit');
const dotenv = require('dotenv');
dotenv.config();

/**
 * An IIFE (Immediately Invoked Function Expression) to
 * encapsulate the TwitterBot functionality.
 */
(function(root) {
  /**
   * The TwitterBot object: Holds the data relevant to the bot.
   */
  function TwitterBot() {
    this.unitOfTime = 'hours';
    this.oneUnitOfTime = 60 * 60 * 1000;
    this.numberOfUnitsOfTimeForRetweet = 6;
    this.numberOfUnitsOfTimeForFollow = 6;
    this.intervalForRetweet = this.numberOfUnitsOfTimeForRetweet * this.oneUnitOfTime;
    this.intervalForFollow = this.numberOfUnitsOfTimeForFollow * this.oneUnitOfTime;
    this.selectedTweetForRetweet;
    this.selectedTweetForFollow;

    /**
     * A Twit object to call Twitter API.
     */
    this.Twitter = new twit({
      consumer_key: process.env.BOT_CONSUMER_KEY,
      consumer_secret: process.env.BOT_CONSUMER_SECRET,
      access_token: process.env.BOT_ACCESS_TOKEN,
      access_token_secret: process.env.BOT_ACCESS_TOKEN_SECRET
    });

    /**
     * A parameters object for get('search/tweets')
     */
    this.paramsForSearch = {
      q: '#100DaysOfCode -filter:retweets',
      result_type: 'recent',
      count: 50,
      lang: 'en'
    };

    /**
     * A parameters object for Sentiment API
     */
    this.optionsForSentiment = {
      extras: {
        'learned': 2,
        'learnt': 2,
        'learning': 2,
        'learn': 1
      }
    };

    /**
     * Initialise Sentiment API
     */
    this.sentiment = new Sentiment();
  }

  /**
   * Tweet: Takes a string and tweets it.
   */
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

  /**
   * Retweet: Searches through the recent tweets, selects a tweet
   * based on Sentiment AFINN score and retweets it.
   */
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

  /**
   * Follow: Gets a list of recent tweets, selects a tweet
   * based on Sentiment AFINN score, and follows the
   * user (if not followed already!) who tweeted it.
   */
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

  /**
   * greetNewFollowers: If a new user follows my account, send
   * a 'greeting' tweet mentioning the new user.
   */
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

  /**
   * Here are the calls to each of the functions, which are commented
   * for safety reasons. Only test one function at a time. If called
   * indiscriminately, it's quite easy to hit the Twitter API Rate Limits.
   * And possibly get banned!!! You have been warned.
   */
  // twitterBot.tweet("Hello World!");
  // twitterBot.retweet();
  setInterval(twitterBot.retweet.bind(twitterBot), twitterBot.intervalForRetweet);
  // twitterBot.follow();
  setInterval(twitterBot.follow.bind(twitterBot), twitterBot.intervalForFollow);
  // twitterBot.greetNewFollowers();
})(this);
