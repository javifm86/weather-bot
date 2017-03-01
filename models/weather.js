const request = require( 'request' );
const config = require('../config.js');
const utils = require('../utils/utils.js');

// OpenWeatherMap API params
const WEATHER_BASE = 'http://api.openweathermap.org/data/2.5/forecast?';
const TOKEN_WEATHER = config.OPENWEATHER_TOKEN;


/**
 *  Return OpenWeatherMap url for weather petition.
 *  
 *  @param  {Object} params : Object with lat and lon properties according to user location.
 */

const getUrl = function( params ) {

    var getParams = {
        'appid': TOKEN_WEATHER,
        'units': 'metric',
        'lang': 'sp',
        'lat': params.lat,
        'lon': params.lon
    };

    return WEATHER_BASE + utils.encodeQueryData( getParams );
};

/**
 *  Weather methods.
 */

function Weather() {

    /**
     *  Get weather.
     *  
     *  @param  {Object} params           : Params for request.
     *  @param  {Array}  additionalParams : Array with additional params that will be passed when
     *                                      promise is rejected / resolved.
     */
    
    this.get = function( params, additionalParams ) {

        return new Promise( ( resolve, reject ) => {

            let url = getUrl( params );

            request( url, function( error, response, data ) {

                if ( error ) {

                    reject( {
                        data: JSON.parse( data ),
                        params: additionalParams
                    } );

                }
                else {

                    resolve( {
                        data: JSON.parse( data ),
                        params: additionalParams
                    } );

                }

            } );

        } );

    };

}

// Export public methods
module.exports = new Weather();
