let connectionPg = require('./../configuration/PostgresConfig');

let roomPostgres = {};

roomPostgres.getAllRooms = function () {
  return new Promise(function (resolve, reject) {
     let request = 'SELECT id,datecreation,roomname,description,password,image,estactif FROM rooms';

     connectionPg.query(request,null,(err,res) => {
        if(res.rows[0] === 'undefined'){
            resolve([]);
        }else{
            for(let i = 0; i < res.rows.length; i++){
                if(res.rows[i].password.length > 0){
                    res.rows[i].password = true;
                }
            }
            resolve(res.rows);
        }
     });
  });
};

roomPostgres.getRoom = function (roomName) {
    return new Promise(function (resolve, reject) {
        let request = 'SELECT id,datecreation,roomname,description,password,image,estactif FROM rooms WHERE roomname = $1';
        let tableRequest = [roomName];

        connectionPg.query(request,tableRequest,(err,res) => {
            if (res.rows[0] === 'undefined'){
                reject();
            } else {
                resolve(res.rows[0]);
            }
        });
    });
};

roomPostgres.joinRoom = function (idUser,idRoom,token) {
    return new Promise(function (resolve, reject) {
        let adminRoom = 'SELECT * FROM users_rooms WHERE rooms_id = $1 AND users_id = $2';
        let tableAdminRoomRequest = [idRoom,
                                     idUser];

        connectionPg.query(adminRoom,tableAdminRoomRequest,(err,res) => {

            // delete old tokens
            let endRequest = '';
            for(let i = 0; i < res.rows.length; i++){
                endRequest += ('token_ws=\'' + res.rows[i].token_ws + '\'');
                if(i < res.rows.length - 1){
                    endRequest += ' or ';
                }
            }
            let requestDelete = 'DELETE FROM users_rooms WHERE ' + endRequest;
            connectionPg.query(requestDelete,null,(err,res) => {
                console.log('Delete done for request : ' + endRequest);
            });

            let roomUser = res.rows[0];

            let request = 'INSERT INTO users_rooms(users_id,rooms_id,token_ws,role) VALUES ($1,$2,$3,$4)';

            let tableRequest = [];

            if (!roomUser || !roomUser.role || roomUser.role === 'USER') {
                tableRequest = [idUser, idRoom, token, 'USER'];
            } else {
                tableRequest = [idUser, idRoom, token, 'ADMIN'];
            }

            connectionPg.query(request,tableRequest,(err,res) => {
                if (res.rows[0] === 'undefined'){
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    });
};

roomPostgres.isAuthorizedToJoin = function (tokenWS) {
    return new Promise(function (resolve, reject) {
        let findRoom = 'SELECT rooms.id,rooms.roomname,rooms.estactif,users_rooms.users_id,users_rooms.role,users_rooms.token_ws FROM rooms JOIN users_rooms ON (rooms.id=users_rooms.rooms_id) WHERE token_ws = $1';
        let findRoomRequest = [tokenWS];

        connectionPg.query(findRoom,findRoomRequest,(err,res) => {
            if (res.rows[0] === 'undefined'){
                reject();
            } else {
                resolve(res.rows[res.rows.length - 1]);
            }
        });
    });
};

module.exports = roomPostgres;