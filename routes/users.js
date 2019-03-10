let express = require('express');
let router = express.Router();

let userPostgres = require('../public/javascripts/model/User');
let chatElasticSearch = require('./../public/javascripts/model/ChatElasticSearch');
let oauthService = require('./oauth');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/search', function (req, res) {
  let pseudo = req.query.q;

  if(!pseudo || pseudo.length < 4){
    sendErrorMessage(res,412,"Le paramètre pseudo n'est pas correct");
    return;
  }

  chatElasticSearch.findPseudo(pseudo).then(function (value) {
    if(value.hits.hits.length > 0){
      res.status(200).send({ message : value.hits.hits });
      return;
    }

    sendErrorMessage(res, 400, "PSEUDO_NOT_EXISTING");
  }).catch(function () {
    sendErrorMessage(res, 500, "Problème lors de la recherche du pseudo");
  })

});

router.get('/getUser', oauthService.oauth.authenticate(), function (req,res) {

  let token = req.headers.authorization;
  if(!token){
    sendErrorMessage(res, 401, "NO_TOKEN");
    return;
  }

  token = token.split(' ')[1];

  userPostgres.findOneUserWithToken(token).then(function (user) {
    if(!user){
      sendErrorMessage(res,401,"Problème d'identification");
      return;
    }
    res.status(200).send(user);
  }).catch(function (error) {
    sendErrorMessage(res,401,"Problème d'identification");
  });
});

router.post('/create', function (req, res) {

  let body = req.body;

  if (!body || !body.pseudo || !body.password) {
    sendErrorMessage(res,412,"Les paramètres ne sont pas corrects");
    return;
  }

  userPostgres.findOneUser(body.pseudo).then(function (value) {
    if (value) {
      sendErrorMessage(res, 412, "Ce pseudo existe déjà");
      return;
    }

    userPostgres.saveNewUser(body.pseudo, body.password).then(function (value) {
      res.status(200).send({ message : 'OK' });

      chatElasticSearch.addPseudo(body.pseudo).then(function () {
        console.log(body.pseudo + ' indexé dans ElasticSearch');
      }).catch(function () {
        console.log('Erreur lors de l\'indexation de ' + body.pseudo + ' dans ElasticSearch');
      })
    }).catch(function (reasonWrite) {
      res.status(500).send(reasonWrite);
    });
  });

});

/*router.get('/getPseudoWithSession/:sessionId', function (req, res) {
  let sessionId = req.params.sessionId;

  if(!sessionId || sessionId.length < 10){
    sendErrorMessage(res,412,"Le paramètre sessionId n'est pas correct");
    return;
  }

  userMongo.findOneUserWithSession(sessionId).then(user => {
    if(user.pseudo) {
      res.status(200).send({ message : user.pseudo });
    }else{
      sendErrorMessage(res, 404, "SessionId not found");
    }
  });
});*/

function sendErrorMessage(res, code, message){
  res.status(code).send({
    code : code,
    message : message
  });
}

module.exports = router;
