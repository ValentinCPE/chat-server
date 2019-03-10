let util = require('util');

let express = require('express');
let router = express.Router();
let OAuthServer = require('express-oauth-server');

let startUrl = '/api/chat';

// Add OAuth server.
router.oauth = new OAuthServer({
    debug: true,
    model: require('./../public/javascripts/model/modelOauth'),
    allowBearerTokensInQueryString: true,
    accessTokenLifetime: 4 * 60 * 60,
    refreshTokenLifetime: 4 * 30 * 24 * 60 * 60, //4 mois
    useErrorHandler: false
});

// Post token.
router.post('/oauth/token', router.oauth.token());

// Get authorization.
router.get('/oauth/authorize', function(req, res) {
    // Redirect anonymous users to login page.
    if (!req.app.locals.user) {
        return res.redirect(startUrl + util.format('/login?redirect=%s&client_id=%s&redirect_uri=%s', req.path, req.query.client_id, req.query.redirect_uri));
    }

    return res.render('authorize', {
        client_id: req.query.client_id,
        redirect_uri: req.query.redirect_uri
    });
});

// Post authorization.
router.post('/oauth/authorize', function(req, res) {
    // Redirect anonymous users to login page.
    if (!req.app.locals.user) {
        return res.redirect(startUrl + util.format('/login?client_id=%s&redirect_uri=%s', req.query.client_id, req.query.redirect_uri));
    }

    return router.oauth.authorize();
});

// Get login.
router.get('/login', function(req, res) {
    return res.render('login', {
        redirect: req.query.redirect,
        client_id: req.query.client_id,
        redirect_uri: req.query.redirect_uri
    });
});

// Post login.
router.post('/login', function(req, res) {
    if (req.body.email !== 'thom@nightworld.com') {
        return res.render('login', {
            redirect: req.body.redirect,
            client_id: req.body.client_id,
            redirect_uri: req.body.redirect_uri
        });
    }

    // Successful logins should send the user back to /oauth/authorize.
    let path = req.body.redirect || '/home';

    return res.redirect(startUrl + util.format('/%s?client_id=%s&redirect_uri=%s', path, req.query.client_id, req.query.redirect_uri));
});

// Get secret.
router.get('/secret', router.oauth.authenticate(), function(req, res) {
    // Will require a valid access_token.
    res.send('Secret area');
});

router.get('/public', function(req, res) {
    // Does not require an access_token.
    res.send('Public area');
});

module.exports = router;