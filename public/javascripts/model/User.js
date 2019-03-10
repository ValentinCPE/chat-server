const bcrypt = require('bcrypt');
let connectionPg = require('./../configuration/PostgresConfig');

const saltRounds = 10;

let userPostgres = {};

userPostgres.findOneUserWithToken = function (token) {
    let request = 'SELECT users.id,users.pseudo,users.derniereconnexion,users.datecreation,users.estactif FROM users JOIN oauth_tokens ON (users.id=oauth_tokens.user_id) WHERE access_token = $1';
    let tableRequest = [token];

    return new Promise(function (resolve, reject) {
        connectionPg.query(request,tableRequest,(err,res) => {
            if (res.rows[0] === 'undefined'){
                resolve(false);
            } else {
                resolve(res.rows[0]);
            }
        });
    });
};

userPostgres.findOneUser = function (pseudo) {
    let request = 'SELECT * FROM users WHERE pseudo = $1';
    let tableRequest = [pseudo];

    return new Promise(function (resolve, reject) {
        connectionPg.query(request,tableRequest,(err,res) => {
            if (res.rows[0] === 'undefined'){
                resolve(false);
            } else {
                resolve(res.rows[0]);
            }
        });
    });
};

userPostgres.findOneUserWithId = function (id) {
    let request = 'SELECT users.id,users.pseudo,users.derniereconnexion,users.datecreation FROM users WHERE id = $1';
    let tableRequest = [id];

    return new Promise(function (resolve, reject) {
        connectionPg.query(request,tableRequest,(err,res) => {
            if (res.rows[0] === 'undefined'){
                resolve(false);
            } else {
                resolve(res.rows[0]);
            }
        });
    });
};

userPostgres.hasJustLoggedIn = function (id) {
    let request = 'UPDATE users SET derniereconnexion = $1 WHERE id = $2;';
    let tableRequest = [new Date(),
                        id];

    return new Promise(function (resolve, reject) {
        connectionPg.query(request,tableRequest,(err,res) => {
            if (res.rows[0] === 'undefined'){
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
};

userPostgres.saveNewUser = function (pseudo, password) {
    return new Promise(function (resolve, reject) {
        bcrypt.hash(password, saltRounds).then(function (hash) {
            // Store hash in your password DB.
            let userToAdd = [
                pseudo,
                hash,
                new Date(),
                new Date()
            ];

            let request = 'INSERT INTO users(pseudo, password, derniereConnexion, dateCreation) VALUES($1, $2, $3, $4)';

            connectionPg.query(request, userToAdd, (err, res) => {
                if (err !== null) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        }).catch(function (err) {
            reject(err);
        });
    });
};

module.exports = userPostgres;