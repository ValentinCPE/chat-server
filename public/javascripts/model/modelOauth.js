const bcrypt = require('bcrypt');
let connectionPg = require('./../configuration/PostgresConfig');
let userPostgres = require('./User');
let model = {};

/*
 * Get access token.
 */

model.getAccessToken = function(bearerToken) {
    return connectionPg.query('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE access_token = $1', [bearerToken])
        .then(function(result) {
            let token = result.rows[0];

            return {
                accessToken: token.access_token,
                client: {id: token.client_id},
                expires: token.access_token_expires_on,
                accessTokenExpiresAt: token.access_token_expires_on,
                user: {id: token.user_id},
            };
        });
};

/**
 * Get client.
 */

model.getClient = function *(clientId, clientSecret) {
    return connectionPg.query('SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE client_id = $1 AND client_secret = $2', [clientId, clientSecret])
        .then(function(result) {
            let oAuthClient = result.rows[0];

            if (!oAuthClient) {
                return;
            }

            return {
                clientId: oAuthClient.client_id,
                clientSecret: oAuthClient.client_secret,
                grants: ['password','refresh_token'], // the list of OAuth2 grant types that should be allowed
            };
        });
};

/**
 * Get refresh token.
 */

model.getRefreshToken = function *(bearerToken) {
    return connectionPg.query('SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE refresh_token = $1', [bearerToken])
        .then(function(result) {
            if (result.rowCount) {
                let token = {
                    refreshToken: result.rows[0].refresh_token,
                    refreshTokenExpiresAt: result.rows[0].refresh_token_expires_on,
                    client: {id: result.rows[0].client_id},
                    user: {id: result.rows[0].user_id}, // could be any object
                };
                return token;
            }

            return false;
        });
};

model.revokeToken = function *(token) {
    // imaginary DB queries
    return connectionPg.query('DELETE FROM oauth_tokens WHERE refresh_token = $1', [token.refreshToken])
        .then(function() {
            return true;
        }).catch(function () {
            return false;
        });
};

/*
 * Get user.
 */

model.getUser = function *(pseudo, password) {
    return connectionPg.query('SELECT id, password FROM users WHERE pseudo = $1', [pseudo])
        .then(function(result) {
            let row = result.rows[0];

            if (!row) { return false; }

            if (!bcrypt.compareSync(password, row.password)) {
                return false;
            }

            return row;
        });
};

/**
 * Save token.
 */

model.saveToken = function *(token, client, user) {
    return connectionPg.query('INSERT INTO oauth_tokens(access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id) VALUES ($1, $2, $3, $4, $5, $6)', [
        token.accessToken,
        token.accessTokenExpiresAt,
        client.clientId,
        token.refreshToken,
        token.refreshTokenExpiresAt,
        user.id
    ]).then(function(result) {
        return userPostgres.hasJustLoggedIn(user.id).then(function () {
            return result.rowCount ? {
                accessToken: token.accessToken,
                client: {id: token.clientId},
                expires: token.accessTokenExpiresAt,
                user: {id: token.userId}, // could be any object
            } : false;
        });
    });
};

module.exports = model;