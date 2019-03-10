let connection = {};
let dbMongo;
let isConnected = false;
let MongoClient = require('mongodb').MongoClient;
let urlMongo = 'mongodb://mongo:27017';

connection.connect = function() {
    if(!isConnected){
        return MongoClient.connect(urlMongo, { useNewUrlParser: true }).then(db => {
            dbMongo = db.db('ChatDB');
            isConnected = true;
            return dbMongo;
        }, error => {
            console.error('MongoDB connection impossible');
            process.exit(1);
        });
    }else{
        return dbMongo;
    }
};

module.exports = connection;