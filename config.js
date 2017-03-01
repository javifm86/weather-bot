const str = require( './strings.js' );

const config = {
    TELEGRAM_BOT_TOKEN: 'PUT_YOUR_TELEGRAM_BOT_TOKEN',
    OPENWEATHER_TOKEN: 'PUT_YOUR_OPENWEATHER_TOKEN',
    SQLITE_DB_PATH: '/path/to/your/db/file/users',
    REQUIRED_PARAMS: 4,
    PREDICTION_NUMBER: 6,
    ICONS: {
        SUN: '\u2600',
        CLOUD: '\u2601',
        RAIN: '\u2614',
        PART_CLOUDY: '\u26C5',
        SNOW: '\u2744',
        HOT_SPRINGS: '\u2668',
        WARNING: '\u26A0',
        RAY: '\u26A1'
    },
    KEYBOARD: {

        HOURS: {
            keyboard: [
                [ '0', '1', '2', '3', '4', '5' ],
                [ '6', '7', '8', '9', '10', '11' ],
                [ '12', '13', '14', '15', '16', '17' ],
                [ '18', '19', '20', '21', '22', '23' ]
            ],
            resize_keyboard: true
        },

        MINUTES: {
            keyboard: [
                [ '00', '10', '20' ],
                [ '30', '40', '50' ],
            ],
            resize_keyboard: true
        },

        LOCATION: {
            keyboard: [
                [ {
                    text: str.sendLocation,
                    request_location: true
                } ]
            ],
            resize_keyboard: true
        }

    },
    RETRY: 300000 // 5 minutes
};

// Exports config object
module.exports = config;
