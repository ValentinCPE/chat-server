let chatElasticSearch = {};

let elasticsearch = require("elasticsearch");
let urlES = 'http://elasticsearch:9200';
let client = new elasticsearch.Client({
    hosts: urlES,
    requestTimeout: 30000,
    pingTimeout: 30000
});

client.ping().then(function () {
    console.log("Elastic server connected");
    checkIndices();
}).catch(function (error) {
    console.log("Elasticsearch server not responding");
    //process.exit(1);
});

function checkIndices() {
    client.indices.exists({index: "chat"}).then(function (value) {
        if (!value) {
            client.indices.create({
                index: "chat",
                body: {
                    mappings: {
                        users: {
                            properties: {
                                pseudo: {type: "text"},
                                added: {type: "date"}
                            }
                        }
                    }
                }
            }).catch(function () {
                console.error('Index ElasticSearch not created cause still existing');
            })
        }
    }).catch(function () {
        console.error('Problem checking index exists');
    });
}

chatElasticSearch.addPseudo = function(pseudo) {
    let now = new Date();
    return new Promise(function (resolve, reject) {
       client.index({
           index: "chat",
           type: "users",
           body: {
               pseudo: pseudo,
               added: now
           },
           refresh: "wait_for"
       }).then(function (value) {
           resolve(value);
       }).catch(function (reason) {
           reject(reason);
       })
    });
};

chatElasticSearch.findPseudo = function(pseudo) {
  return new Promise(function (resolve, reject) {
      client.search({
          index: "chat",
          type: "users",
          _source: ["pseudo"],
          body: {
              query: {
                  match_phrase_prefix: {
                      pseudo: pseudo
                  }
              },
              sort: {
                  added: {
                      order: "desc"
                  }
              }
          }
      }).then(function (value) {
          resolve(value);
      }).catch(function (reason) {
          reject(reason);
      })
  })
};

module.exports = chatElasticSearch;