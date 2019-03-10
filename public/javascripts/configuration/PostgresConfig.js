const pg = require('pg');

const client = new pg.Client({
    user: process.env.USER_PG,
    host: process.env.HOST_PG,
    database: process.env.DB_PG,
    password: process.env.PWD_PG,
    port: process.env.PORT_PG,
});

client.connect().then(function () {
    client.query("SELECT NOW()").then(function () {
        console.log('Connected Postgres DB');
    });
}).catch(function (error) {
});

module.exports = client;

