/**
 *  Class representing a subscription.
 */

class Subscription {

    constructor() {
        this.subscriptions = {};
    }

    add( params ){

        if ( params.chatId != null && this.subscriptions[ params.chatId ] == null ) {
            this.subscriptions[ params.chatId ] = {};
        }

        for ( let key in params ) {

            if ( params.hasOwnProperty( key ) && key !== 'chatId' ) {
                this.subscriptions[ params.chatId ][ key ] = params[ key ];
            }

        }

    }

    get( chatId ){
        return this.subscriptions[ String( chatId ) ];
    }

    remove( chatId ){
        if( this.subscriptions[ String( chatId ) ] ){
            delete this.subscriptions[ String( chatId ) ];
        }
    }

    getNumProps( subscription ){
        return Object.getOwnPropertyNames( subscription ).length;
    }

}

// Export Subscription class
module.exports = Subscription;
