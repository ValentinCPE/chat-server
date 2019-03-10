let chatConnection = require('./../configuration/MongoConfig');
let userPostgres = require('./User');
let chatMongo = {};

chatConnection.connect().then((chatDb) => {
    console.log('connected Chat DB');

    chatMongo.getAllChat = function () {
        return new Promise(function (resolve, reject) {
            chatDb.collection("Chat").find().toArray(function (mongoError, items) {
                if(mongoError){
                    reject(mongoError);
                } else {
                    resolve(items);
                }
            });
        });
    };

    chatMongo.saveChat = function (message) {
        let docToAdd = {
            pseudo: message.pseudo,
            message: message.message,
            style: message.style,
            date: message.date
        };

        return new Promise(function (resolve, reject) {
            chatDb.collection("Chat").insertOne(docToAdd).then(function (value) {
                resolve(value.ops[0]);
            }).catch(function (reason) {
                reject(reason);
            });
        });
    };

    chatMongo.isLoggedIn = function (room) {
        return new Promise(function (resolve, reject) {
            userPostgres.findOneUserWithId(room.users_id).then(function (user) {
                delete room.users_id;
                let docToAdd = {
                    room: room,
                    user: user,
                    Status: 'LOGIN',
                    date: new Date()
                };
                chatDb.collection("Session").insertOne(docToAdd).then(function (value) {
                    resolve(value.ops[0]);
                }).catch(function (reason) {
                    reject(reason);
                });
            }).catch(function (error) {
                reject(error);
            });
        });
    };

    chatMongo.isLoggedOut = function (room) {
        return new Promise(function (resolve, reject) {
            userPostgres.findOneUserWithId(room.users_id).then(function (user) {
                delete room.users_id;
                let docToAdd = {
                    room: room,
                    user: user,
                    Status: 'LOGOUT',
                    date: new Date()
                };
                chatDb.collection("Session").insertOne(docToAdd).then(function (value) {
                    resolve(value.ops[0]);
                }).catch(function (reason) {
                    reject(reason);
                });
            }).catch(function (error) {
                reject(error);
            });
        });
    };
});

module.exports = chatMongo;