let express = require('express');
let router = express.Router();
let randomstring = require("randomstring");

let roomPostgres = require('../public/javascripts/model/Room');
let chatMongo = require('../public/javascripts/model/ChatMongo');

const pwdLinkMiddle = process.env.pwdLinkMiddle;

router.get('/getRooms', function (req,res) {
   roomPostgres.getAllRooms().then(function (rooms) {
       res.status(200).send(rooms);
   }).catch(function (error) {
       res.status(200).send({message : []});
   });
});

router.post('/join', function (req,res) {
    let idUser = req.body.idUser;
    let roomName = req.body.roomName;
    let passwordRoom = req.body.passwordRoom;

    if(!idUser){
        sendErrorMessage(res,412,"Les paramètres ne sont pas corrects");
        return;
    }

    if(!roomName || roomName.length < 6){
        sendErrorMessage(res,412,"Vous devez choisir un salon");
        return;
    }

    roomPostgres.getRoom(roomName).then(function (room) {

        if (passwordRoom && room.password !== passwordRoom) {
            sendErrorMessage(res,401,"Mauvais mot de passe de salon");
            return;
        }

        let tokenWS = randomstring.generate({
            length: 8,
            charset: 'alphanumeric'
        });

        roomPostgres.joinRoom(idUser,room.id,tokenWS).then(function (saved) {
            if (!saved) {
                sendErrorMessage(res,500,"Problème d'autorisation WebSocket");
                return;
            }

            res.status(200).send({message : tokenWS});
        }).catch(function (err) {
            res.status(500).send(err);
        });

    }).catch(function (err) {
        res.status(500).send(err);
    });
});

router.post('/isAuthorizedToJoin', function (req,res) {

    let pwdLinkSent = req.body.pwdLinkSent;
    let tokenWS = req.body.token;

    if(!pwdLinkMiddle || !pwdLinkSent || pwdLinkMiddle !== pwdLinkSent){
        sendErrorMessage(res, 401, 'Unauthorized : PwdLinkMiddle problem');
        return;
    }

    if(!tokenWS){
        sendErrorMessage(res, 412, 'Token WS not present');
        return;
    }

    roomPostgres.isAuthorizedToJoin(tokenWS).then(function (room) {
        res.status(200).send(room);

        chatMongo.isLoggedIn(room).then(function (data) {
            if(data){
                console.log('Connexion utilisateur enregistré sur Mongo');
            }
        });
    }).catch(function (error) {
        sendErrorMessage(res, 500, 'Server problem');
    });

});

router.post('/isDisconnected', function (req,res) {

    let pwdLinkSent = req.body.pwdLinkSent;
    let tokenWS = req.body.token;

    if(!pwdLinkMiddle || !pwdLinkSent || pwdLinkMiddle !== pwdLinkSent){
        sendErrorMessage(res, 401, 'Unauthorized : PwdLinkMiddle problem');
        return;
    }

    if(!tokenWS){
        sendErrorMessage(res, 412, 'Token WS not present');
        return;
    }

    roomPostgres.isAuthorizedToJoin(tokenWS).then(function (room) {
        res.status(200).send({message : "OK"});

        chatMongo.isLoggedOut(room).then(function (data) {
            if(data){
                console.log('Déconnexion utilisateur enregistré sur Mongo');
            }
        });
    }).catch(function (error) {
        sendErrorMessage(res, 500, 'Server problem');
    });

});

router.get('/getMessages', function (req,res) {
    chatMongo.getAllChat().then(function (messages) {
       if(messages) {
           res.status(200).send(messages);
       }else{
           res.status(200).send([]);
       }
    });
});

function sendErrorMessage(res, code, message){
    res.status(code).send({
        code : code,
        message : message
    });
}

module.exports = router;