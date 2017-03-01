const utils = {

    capitalizeFirstLetter( str ) {
        return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
    },

    padLeft( str, fillTo, padChar ) {

        fillTo = parseInt( fillTo, 10 );

        if ( padChar == null ) {
            padChar = '0';
        }

        var pad = new Array( 1 + fillTo ).join( padChar );
        return ( pad + str ).slice( -pad.length );

    },

    /**
     *  Create query string for web service call.
     *  
     *  @param  {Object} data : Object with get params. Key is used as param name, value for the
     *                          value of the param.
     */

    encodeQueryData( data ) {
        let ret = [];
        for ( let d in data ) {
            ret.push( encodeURIComponent( d ) + '=' + encodeURIComponent( data[ d ] ) );
        }
        return ret.join( '&' );
    }

};

module.exports = utils;
