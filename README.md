# twitter-bot

A Twitter bot for my account!

![license](https://img.shields.io/github/license/raravi/twitter-bot)&nbsp;&nbsp;![version](https://img.shields.io/github/package-json/v/raravi/twitter-bot)&nbsp;&nbsp;![dependencies](https://img.shields.io/depfu/raravi/twitter-bot)&nbsp;&nbsp;![last-commit](https://img.shields.io/github/last-commit/raravi/twitter-bot)

I started this project with the intention of learning **Twitter APIs**, and it grew into a nice little bot for keeping track of recent updates on my Twitter.

The code is written in Javascript which runs in **node.js** environment and is deployed on **Heroku**.

It demonstrates the following capabilities:

## Tweet
Tweet something interesting from any source!

## Retweet
Retweet based on a query string and filter conditions.

## Follow
Follow a user based on preferences such as hashtags, Sentiment AFINN scores.

## Greet New Followers
Greet new followers with a welcome message. An easy way to kick start conversations!

## Setup
Follow these steps for setting up your own twitter bot from this repository:

1. Fork this repository.

2. Get Developer access on your twitter account, or create a new account. You will get 4 keys from there: API key, API secret key, Access token, Access token secret.

3. Use the 4 keys/tokens to initialize the Twit code. You can access the documentation at [twit](https://github.com/ttezel/twit) for help with this.

4. Create a Free Tier Heroku account, and create a new app in there. See the [node.js deployment page](https://devcenter.heroku.com/articles/getting-started-with-nodejs?singlepage=true) on Heroku for more information.

Have fun!
