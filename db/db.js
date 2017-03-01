const sqlite3 = require( 'sqlite3' ).verbose();
const config = require( '../config' );
let db;

const CREATE = 'CREATE TABLE IF NOT EXISTS user (chatId INTEGER, hour INTEGER, minute INTEGER, lat TEXT, lon TEXT)';
const SELECT_USER = 'SELECT * FROM user';
const INSERT = 'INSERT INTO user VALUES (?,?,?,?,?)';
const DELETE = 'DELETE FROM user WHERE chatId=?';

const openDb = function() {
    db = new sqlite3.Database( config.SQLITE_DB_PATH );
};

const closeDb = function() {
    db.close();
};

const database = {

    init() {

        return new Promise( ( resolve, reject ) => {

            openDb();

            db.serialize( () => {

                db.run( CREATE );

                db.all( SELECT_USER, ( err, arrayRows ) => {
                    console.log( arrayRows );
                    if ( err ) {
                        reject();
                    }
                    else {
                        resolve( arrayRows );
                    }

                    closeDb();

                } );

            } );

        } );

    },

    subscribeUser( subscription, chatID ) {

        return new Promise( ( resolve, reject ) => {

            openDb();

            db.serialize( () => {

                try {

                    var stmt = db.prepare( INSERT );
                    stmt.run( chatID, subscription.hour, subscription.minute, subscription.lat, subscription.lon );
                    stmt.finalize();
                    resolve();
                }
                catch ( e ) {
                    reject();
                }

                closeDb();

            } );

        } );

    },

    deleteUser( chatID ) {

        return new Promise( ( resolve, reject ) => {

            openDb();

            db.serialize( () => {

                try {
                    var stmt = db.prepare( DELETE );
                    stmt.run( chatID );
                    stmt.finalize();
                    resolve();
                }
                catch ( e ) {
                    reject();
                }

                closeDb();

            } );

        } );

    }

};

// Export public methods
module.exports = database;
