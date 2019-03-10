let mongo = require('./../model/ChatMongo');

let rabbitmq = {};
let messagesProcessed = 'messages-processed';
let messagesReceived = 'messages-received';

let open = require('amqplib').connect('amqp://rabbitmq');

let connection;

rabbitmq.initRabbitMQ = function () {
    // Consumer
    open.then(function(conn) {
        return conn.createChannel();
    }).then(function(ch) {
        connection = ch;
        return ch.assertQueue(messagesReceived, {durable: true}).then(function(ok) {
            console.log('Joined queue');
            return ch.consume(messagesReceived, function(msg) {
                if (msg !== null) {
                    let jsonSaved = JSON.parse(msg.content);
                    mongo.saveChat(jsonSaved).then(data => {
                        console.log('Message saved in MongoDB : ' + JSON.stringify(data));
                        ch.ack(msg);
                    }, error => {
                       console.error(error);
                       ch.reject(msg, true); //If there's a problem during message saving, we send back the message to the queue to be saved by another container
                    });
                }
            });
        });
    }).catch(console.warn);

    rabbitmq.sendMessage = function (message) {
        if (!connection){
            console.error('Connexion RabbitMQ null');
            return;
        }
        return connection.assertQueue(messagesProcessed, {durable: true}).then(function(ok) {
            return connection.sendToQueue(messagesProcessed, Buffer.from(JSON.stringify(message)), {persistent: true});
        });
    };
};

module.exports = rabbitmq;