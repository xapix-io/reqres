const glob = require("glob");
const fs = require("fs");

const config = {
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "Xapix ReqRes"
  },
  "paths": {},
  "definitions": {}
};

const enrichConfig = function(path) {
  glob.sync("./swagger/" + path + "/*.json").forEach(file => {
		var jsonObj = JSON.parse(fs.readFileSync(file));
    for (var k in jsonObj) {
      config[path][k] = jsonObj[k]
    }
	});
};


enrichConfig("paths");
enrichConfig("definitions");

// console.log(config);

module.exports = config;
