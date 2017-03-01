# weather-bot
Simple telegram weather bot with **NodeJS**. Bot can give current weather for a given location and manage subscriptions for users to be alerted everyday with weather prediction.

## Requirements ##
- Create a bot and get your bot token. More info in [Telegram web.](https://core.telegram.org/bots) 
- Register for free and get your token in [OpenWeatherMap.](https://openweathermap.org/api)

## Instalation ##
Edit the following info in `config.js`.  

- Place your telegram bot token in `TELEGRAM_BOT_TOKEN`.  
- Put your openweather token in `OPENWEATHER_TOKEN`.  
- Set the absolut path for sqlite database file in `SQLITE_DB_PATH`.  

Download dependencies and run in NodeJS:  

    npm install   
    node index.js    

## Considerations ##
This bot was made just for fun, I just did it to learn basics of Telegram bot API. I have it running on my Raspberry Pi. If you use this bot and it gets so popular that many people use it, please consider limitations of the API.

From [Telegram web](https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this).
> **My bot is hitting limits, how do I avoid this?**
> 
> When sending messages inside a particular chat, avoid sending more than one message per second. We may allow short bursts that go over this limit, but eventually you'll begin receiving 429 errors.
> 
> If you're sending bulk notifications to multiple users, the API will not allow more than 30 messages per second or so. Consider spreading out notifications over large intervals of 8—12 hours for best results.
> 
> Also note that your bot will not be able to send more than 20 messages per minute to the same group.
> 
> 
> **How can I message all of my bot's subscribers at once?**
> 
> Unfortunately, at this moment we don't have methods for sending bulk messages, e.g. notifications. We may add something along these lines in the future.
> 
> In order to avoid hitting our limits when sending out mass notifications, consider spreading them over longer intervals, e.g. 8-12 hours. The API will not allow more than ~30 messages to different users per second, if you go over that, you'll start getting 429 errors.

From [OpenWeatherMap web](https://openweathermap.org/price), free plan allows **60 calls per minute**.

