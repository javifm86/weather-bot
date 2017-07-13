const request = require( 'request' );
const CronJob = require( 'cron' ).CronJob;
const moment = require( 'moment' );

// App own modules
const config = require( './config.js' );
const weather = require( './models/weather.js' );
const Subscription = require( './models/subscription.js' );
const Crontab = require( './models/crontab.js' );
const db = require( './db/db.js' );
const str = require( './strings.js' );
const utils = require( './utils/utils.js' );

// Telegram modules
const TeleBot = require( 'telebot' );
const bot = new TeleBot( config.TELEGRAM_BOT_TOKEN );

// Subscription in memory
const subscriptions = new Subscription();

// Crontab
const crontab = new Crontab();

/* ==========================================================================
   FUNCTIONS
   ========================================================================== */

/**
 *  Function called when db.init() promise is resolved.
 *  
 *  @param  {Array} bdSubs : Array of objects with subscriptions returned from database.
 *                            [{ 
 *                               chatId: 12345678,
 *                               hour: 18,
 *                               minute: 30,
 *                               lat: '40.4172134',
 *                               lon: '-3.7046163' 
 *                            }]
 *
 */

const initApp = function( bdSubs ) {

    // Iterate subscriptions, keep references in memory and start its cronjob for notification
    for ( let i = 0, len = bdSubs.length; i < len; i++ ) {
        subscriptions.add( bdSubs[ i ] );
        crontab.start( bdSubs[ i ], bdSubs[ i ].chatId, checkWeather );
    }

    // Once each subscription has its cronjob, initialize Telegram bot
    initBot();

};

/**
 *  Initialize telegram bot.
 */

const initBot = function() {

    // /start is called when user inits chat with bot
    bot.on( '/start', function( msg, reply, next ) {

        // Welcome message
        let welcome = str.insert( str.welcome, [ {
            key: 'name',
            value: msg.from.first_name
        } ] );

        // Bot sends welcome message to user and custom keyboard is showed
        let success = bot.sendMessage( msg.from.id, welcome, {
            parseMode: 'html',
            replyMarkup: getMainKeyboard( msg.from.id )
        } );

    } );

    // Simple text is received by the bot
    bot.on( 'text', function( msg, reply, next ) {

        // Current subscription
        let current = subscriptions.get( msg.from.id );

        let isNum = parseInt( msg.text, 10 );

        // If text is a number we analyze the situation
        if ( !isNaN( isNum ) ) {
            analyzeNumber( msg, reply, next, isNum );
        }
        else {

            // Recognized actions based on known texts required
            switch ( msg.text ) {

                case str.subscribe:

                    if ( current == null ) {
                        subscriptions.add( {
                            chatId: msg.from.id
                        } );
                        subscriptionStep( 2, msg.from.id );
                    }
                    break;

                case str.state:
                    showSubscription( msg, reply, next );
                    break;

                case str.unsubscribe:
                    cancelSubscription( msg, reply, next );
                    break;

                case str.current:
                    showCurrentWeather( msg, reply, next );
                    break;

            }

        }

    } );

    // Location received by the bot
    bot.on( 'location', function( msg, reply, next ) {

        let current = subscriptions.get( msg.from.id );

        // Location received after step 1 and 2 completed on registering subscription
        if ( current != null && current.lat == null ) {

            // Location without subscription finished is not allowed
            if ( subscriptions.getNumProps( current ) === 2 ) {

                subscriptions.add( {
                    chatId: msg.from.id,
                    lat: msg.location.latitude,
                    lon: msg.location.longitude
                } );

                // Update reference for current subscription
                current = subscriptions.get( msg.from.id );

                // Register new subscription to database
                db.subscribeUser( current, msg.from.id ).then( () => {
                    crontab.start( current, msg.from.id, checkWeather );
                    alertUser( msg.from.id, str.subscriptionCompleted );
                } );

            }

        }

        // Current weather request
        else {
            checkWeatherNow( msg.from.id, {
                lat: msg.location.latitude,
                lon: msg.location.longitude
            } );
        }

    } );

    // Once declared events for bot, connect telegram bot
    bot.start();

};

/**
 *  Show main keyboard actions based on chatId subscription.
 *  
 *  @param  {Number} chatId : Chat id.
 */

const getMainKeyboard = function( chatId ) {

    // Check if current chat has subscription
    let current = subscriptions.get( chatId );

    // Prepare markup for sendMessage method
    let markup = {
        keyboard: [],
        one_time_keyboard: false,
        resize_keyboard: true
    };

    // If user is subscribed, we push state and unsubscribe buttons for keyboard
    if ( current != null ) {
        markup.keyboard.push( [ str.state ] );
        markup.keyboard.push( [ str.unsubscribe ] );
    }

    // Subscribe button
    else {
        markup.keyboard.push( [ str.subscribe ] );
    }

    // Retrieve current weather is always showed
    markup.keyboard.push( [ str.current ] );

    return markup;

};

/**
 *  Send message to the user and show main keyboard.
 *  
 *  @param  {Number} chatId  : Chat id.
 *  @param  {String} message : Message to send.
 */

const alertUser = function( chatId, message ) {

    bot.sendMessage( chatId, message, {
        parseMode: 'html',
        replyMarkup: getMainKeyboard( chatId )
    } );

};

/**
 *  According to the step on adding subscription, send message to the user
 *  requesting data, and show custom keyboard.
 *  
 *  @param  {Number} step   : Number of step.
 *  @param  {Number} chatId : Id for the chat.
 */

const subscriptionStep = function( step, chatId ) {

    let msg = null;
    let markup = null;
    let defaultParams = {
        parseMode: 'html'
    };

    switch ( step ) {

        // Hour for notification
        case 2:
            msg = str.subscriptionHour;
            markup = config.KEYBOARD.HOURS;
            break;

            // Minute for notification
        case 3:
            msg = str.subscriptionMinute;
            markup = config.KEYBOARD.MINUTES;
            break;

            // Request location    
        case 4:
            msg = str.subscriptionLocation;
            markup = config.KEYBOARD.LOCATION;
            break;

    }

    // Formatting markup
    if ( markup != null ) {
        defaultParams.markup = markup;
    }

    // Send message to the user
    return bot.sendMessage( chatId, msg, defaultParams );

};

/**
 *  Function that checks the weather for a given subscription.
 *  Invoked when a cronjob is executed.
 *  
 *  @param  {Number}  chatId  : Id for chat.
 *  @param  {Boolean} isRetry : If it is a retry.
 */

const checkWeather = function( chatId, isRetry ) {

    if ( isRetry == null ) {
        isRetry = false;
    }

    let result = weather.get( subscriptions.get( chatId ), [ isRetry, chatId ] );
    result.then( parseResponse ).catch( responseError );
};

/**
 *  Check current weather right now.
 *  
 *  @param  {Number} chatId : Id for chat.
 *  @param  {Object} params : Object with lat and lon properties. 
 */

const checkWeatherNow = function( chatId, params ) {
    let result = weather.get( params, [ true, chatId ] );
    result.then( parseResponse ).catch( responseError );
};

/**
 *  Parse OpenWeatherMap response for a given subscription.
 *  
 *  @param  {Object} options.data   : JSON response.
 *  @param  {Array}  options.params : Array with additional params. On first position, isRetry
 *                                    (Boolean), on second chatId(Number).
 *
 */

const parseResponse = function( {
    data,
    params
} ) {

    let isRetry = params[ 0 ];
    let chatId = params[ 1 ];
    let msg;

    // If error we will retry once
    if ( data.cod == null || data.cod !== '200' ) {

        setTimeout( function() {
            checkWeather( chatId, true );
        }, config.RETRY );

    }

    // Weather data ok
    else {

        msg = `<b>${str.weatherPrediction} ${str.for} ${data.city.name}</b>\n\n`;

        let list = data.list;
        let count;

        if ( list.length < config.PREDICTION_NUMBER ) {
            count = list.length;
        }
        else {
            count = config.PREDICTION_NUMBER;
        }

        // Concat weather prediction messages 
        for ( let i = 0; i < count; i++ ) {
            msg += sendWeather( list[ i ] );
        }

        sendToTelegram( chatId, msg );

    }

};

/**
 *  Schedule a retry in config.RETRY ms.
 */

const retryCheckWeather = function() {

    setTimeout( function() {
        checkWeather( true );
    }, config.RETRY );

};

/**
 *  Error in web service response.
 */

const responseError = function( {
    data,
    params
} ) {

    let isRetry = params[ 0 ];

    if ( !isRetry ) {
        retryCheckWeather();
    }

};

/**
 *  Function that formats each prediction.
 *  
 *  @param  {Object} weatherAlert : Object with prediction info.
 */

const sendWeather = function( weatherAlert ) {

    let time = new Date( weatherAlert.dt * 1000 );
    let timeFormated = moment( time ).format( 'HH:mm' );
    let weatherId = weatherAlert.weather[ 0 ].id;
    let description = utils.capitalizeFirstLetter( weatherAlert.weather[ 0 ].description );
    let minTemperature = Math.round( weatherAlert.main.temp_min );
    let maxTemperature = Math.round( weatherAlert.main.temp_max );
    let msg = '';

    // Weather description with icon
    msg += `${timeFormated}: <b>${description}</b> ${getIcon( weatherId )}\n`;

    // Min and max temperature are different
    if ( minTemperature !== maxTemperature ) {
        msg += `${str.temperature}: ${Math.round(weatherAlert.main.temp_min)}°C - `;
        msg += `${Math.round(weatherAlert.main.temp_max)}°C\n`;
    }

    // No sense showing the same info
    else {
        msg += `${str.temperature}: ${Math.round(weatherAlert.main.temp_max)}°C\n`;
    }

    // Rain
    if ( weatherAlert.rain && weatherAlert.rain[ '3h' ] != null ) {
        msg += `${str.rain}: ${weatherAlert.rain[ '3h' ]}mm\n`;
    }

    // Snow
    if ( weatherAlert.snow && weatherAlert.snow[ '3h' ] != null ) {
        msg += `${str.snow}: ${weatherAlert.snow[ '3h' ]}\n`;
    }

    msg += '\n';

    return msg;

};

/**
 *  Send weather prediction to the user.
 *  
 *  @param  {Number} chatId : Chat id.
 *  @param  {String} msg    : Message to be sent.
 */

const sendToTelegram = function( chatId, msg ) {

    let success = bot.sendMessage( chatId, msg, {
        parseMode: 'html',
        replyMarkup: getMainKeyboard( chatId )
    } );

    success.catch( ( data ) => {

        // User does not receive subscription (blocked or deleted account)       
        if ( data.error_code >= 400 && data.error_code < 500 ) {
            deleteSubscription(chatId);
        }

    } );

};

/**
 *  Return icon weather depending on code returned by OpenWeatherMap.
 *  
 *  @param  {Number} id : Id for type of weather.
 */

const getIcon = function( id ) {

    if ( id >= 200 && id < 300 ) {
        return config.ICONS.RAY;
    }
    else if ( id >= 300 && id < 400 ) {
        return config.ICONS.RAIN;
    }
    else if ( id >= 500 && id < 600 ) {
        return config.ICONS.RAIN;
    }
    else if ( id >= 500 && id < 600 ) {
        return config.ICONS.SNOW;
    }
    else if ( id >= 600 && id < 700 ) {
        return config.ICONS.HOT_SPRINGS;
    }
    else if ( id === 800 ) {
        return config.ICONS.SUN;
    }
    else if ( id >= 800 && id < 900 ) {
        return config.ICONS.CLOUD;
    }
    else {
        return config.ICONS.WARNING;
    }

};

/**
 *  Show subscription for a given chat.
 *  
 *  @param  {Object}   msg   : Object with info about telegram chat returned by Telegram API.
 *  @param  {Object}   reply : Object with reply info.
 *  @param  {Function} next  : Callback from telegram API.
 */

const showSubscription = function( msg, reply, next ) {

    let current = subscriptions.get( msg.from.id );

    // Only show information if subscription exists and it is complete
    if ( current != null && subscriptions.getNumProps( current ) === config.REQUIRED_PARAMS ) {

        let message = '';

        message += `${msg.from.first_name} ${str.showSubscription}`;
        message += ` ${str.at} ${utils.padLeft(current.hour, 2)}:${utils.padLeft(current.minute, 2)}`;

        // Show location for the subscription
        bot.sendMessage( msg.from.id, message ).then( () => {
            bot.sendLocation( msg.from.id, [ current.lat, current.lon ] );
        } );

    }

};

/**
 *  Request location for current weather prediction.
 *  
 *  @param  {Object}   msg   : Object with info about telegram chat returned by Telegram API.
 *  @param  {Object}   reply : Object with reply info.
 *  @param  {Function} next  : Callback from telegram API.
 */

const showCurrentWeather = function( msg, reply, next ) {

    bot.sendMessage( msg.from.id, str.requestLocation, {
        parseMode: 'html',
        replyMarkup: config.KEYBOARD.LOCATION
    } );

};

/**
 *  Cancel existing subscription from weather alert.
 *  
 *  @param  {Object}   msg   : Object with info about telegram chat returned by Telegram API.
 *  @param  {Object}   reply : Object with reply info.
 *  @param  {Function} next  : Callback from telegram API.
 */

const cancelSubscription = function( msg, reply, next ) {

    let current = subscriptions.get( msg.from.id );

    if ( current != null ) {

        db.deleteUser( msg.from.id ).then( () => {
            subscriptions.remove( msg.from.id );
            crontab.stop( msg.from.id );
            alertUser( msg.from.id, str.subscriptionRemoved );
        } );

    }

};

/**
 *  Delete inactive subscription.
 *  
 *  @param  {Number} chatId : Id for chat.
 */

const deleteSubscription = function( chatId ) {

    let current = subscriptions.get( chatId );

    if ( current != null ) {

        db.deleteUser( chatId ).then( () => {
            subscriptions.remove( chatId );
            crontab.stop( chatId );
        } );

    }

};

/**
 *  Analize all cases related to numbers received on bot chat. Bot just requires
 *  numbers to save hour and minute for subscription.
 *  
 *  @param  {Object}   msg   : Object with info about telegram chat returned by Telegram API.
 *  @param  {Object}   reply : Object with reply info.
 *  @param  {Function} next  : Callback from telegram API.
 *  @param  {Number}   num   : Number received.
 */

const analyzeNumber = function( msg, reply, next, num ) {

    if ( num >= 0 && num < 60 ) {

        let current = subscriptions.get( msg.from.id );

        if ( current != null ) {

            let numProp = subscriptions.getNumProps( current );

            // Check that number is required by current step on subscription
            switch ( numProp ) {

                // Hour required, it is the first param
                case 0:

                    if ( num >= 0 && num <= 23 ) {

                        // Add subscription and go to the next step
                        subscriptions.add( {
                            chatId: msg.from.id,
                            hour: num
                        } );
                        subscriptionStep( 3, msg.from.id );

                    }
                    else {
                        bot.sendMessage( msg.from.id, str.subscriptionHourError );
                        subscriptionStep( 2, msg.from.id );
                    }

                    break;

                    // Minute required, it is the second param
                case 1:

                    if ( num >= 0 && num <= 59 ) {

                        subscriptions.add( {
                            chatId: msg.from.id,
                            minute: num
                        } );
                        subscriptionStep( 4, msg.from.id );

                    }
                    else {
                        bot.sendMessage( msg.from.id, str.subscriptionMinuteError );
                        subscriptionStep( 3, msg.from.id );
                    }

                    break;

            }

        }

    }

};

// END FUNCTIONS //

// Initialize app
db.init().then( initApp );
