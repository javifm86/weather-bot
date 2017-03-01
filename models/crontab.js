const CronJob = require( 'cron' ).CronJob;

/**
 *  Class representing a crontab.
 */

class Crontab {

    constructor() {
        this.crontab = {};
    }

    /**
     *  Create and start cronjob.
     *  
     *  @param  {Object}   element  : Subscription element. Just hour and minute are required
     *                                to start cronjob.
     *  @param  {Number}   chatId   : Chat id.
     *  @param  {Function} callback : Callback where chatId for cronjob is returned.
     */
    
    start( element, chatId, callback ){
        
        let cronJob;

        if ( this.crontab[ String( chatId ) ] == null ) {

            cronJob = new CronJob( `0 ${element.minute} ${element.hour} * * *`, function() {
                callback( chatId );
            }, null, true );
            this.crontab[ String( chatId ) ] = cronJob;

        }

    }

    /**
     *  Stop and delete from crontab object a given cronjob.
     *  
     *  @param  {Number} chatId : Chat id.
     */
    
    stop( chatId ){

        if ( this.crontab[ String( chatId ) ] != null ) {
            this.crontab[ String( chatId ) ].stop();
            delete this.crontab[ String( chatId ) ];
        }

    }

}

// Export public methods
module.exports = Crontab;
