var express = require("express"),
    OAuth2Server = require('oauth2-server'),
    Request = OAuth2Server.Request,
    Response = OAuth2Server.Response,
	bodyParser = require("body-parser"),
	soap = require("strong-soap").soap,
	hbs = require("hbs"),
	fs = require("fs"),
	path = require("path"),
	cors = require("cors"),
	https = require("https"),
	http = require("http"),
	swaggerUi = require('swagger-ui-express'),
	swaggerConfig = require('./swagger.js'),
	app = express(),
	port = process.env.PORT || 5000,
	httpsPort = port + 1;

var getRandomInteger = function(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

var rawBodySaver = function(req, res, buf, encoding) {
	if(buf && buf.length) {
		req.rawBody = buf.toString(encoding || 'utf8');
	}
}

app.use(bodyParser.urlencoded({
	extended: false,
	verify: rawBodySaver
}));

app.use(bodyParser.json({
	verify: rawBodySaver
}));

app.use(bodyParser.raw({
	type: '*/*',
	verify: rawBodySaver
}));

app.use(cors());

app.set("views", __dirname + "/views");
app.set("view engine", "html");
app.set("view options", { layout: "layout.html" });
app.engine("html", hbs.__express);
app.use(express.static(path.join(__dirname, "public")));
app.use("/raw", express.static(path.join(__dirname, "data")));

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerConfig));
app.use('/swagger.json', function(_, res) {
  return res.send(swaggerConfig);
});

var routes = require("./routes/");

app.all("/api/*", [
	function(req, res, next) {
		if (req.query && req.query.delay) {
			var delay = req.query.delay;
			if(delay === 'random'){
				var random = getRandomInteger(200, 3000);
				return setTimeout(next, random);
			}
			if(isNaN(delay)){
				return next();
			}
			return setTimeout(next, req.query.delay * 1000);
		}
		return next();
	}
]);

app.all("/secure/*", [
	function(req, res, next) {
		if (req.query && req.query.api_key && req.query.api_key == "ea4c05ed8ec9da03ba63") {
			return next();
		} else if (req.headers && req.headers.authorization && req.headers.authorization == "Basic YXBpX2tleTplYTRjMDVlZDhlYzlkYTAzYmE2Mw==") {
			return next();
		} else {
			return res.status(403).send({error: "missing or wrong API key"});
		}
	}
]);

app.all("/hal/*", [
  function(req, res, next) {
    res.set('Content-Type', 'application/hal+json');
    return next();
  }
]);

app.get("/timeout", [
  function(req, res, next) {
    var timeoutValue = parseInt(req.query.timeout) * 1000;

    var p = new Promise(function(resolve,reject) {
      setTimeout(resolve, timeoutValue);
    });

    p.then(function() {
      res.status(200).send("timeout ended: " + timeoutValue);
    });

  }]);



var model = require("./oauth-model.js");

var oauth = new OAuth2Server({
  model: new model(),
  grants: ['client_credentials'],
  debug: true
});

app.all("/oauth2/token", [
  function(req, res, next) {
    request = new Request(req)
    response = new Response(res)

    oauth.token(request, response)
      .then((token) => {
        res.status(200).json(token);
      })
      .catch((err) => {
        res.status(err.code || 500).json(err)
      });
  }]);

var oauth2middleware = function(req, res, next){

  var request = new Request(req);
  var response = new Response(res);

  var p = new Promise((resolve) => {
    resolve(oauth.authenticate(request, response));
  }).then((data) => {
    res.oauth = data
    next()
  }).catch((err) => {
    res.status(err.code || 500).json(err)
  });;

  return p;
};

app.use("/api/oauth-users", oauth2middleware, routes.get)

app.all("/api/sample-cookies", [function(req, res, next) {
  res.cookie('sample', 42, { domain: req.hostname, path: '/api/sample-cookies', secure: true });
  res.cookie('sample2', 24, { domain: req.hostname, path: '/api/sample-cookies', secure: false });
  res.send('cookie.')
}]);

app.all("/api/show-cookies", [function(req, res, next) {
  res.send(req.headers.cookie)
}]);

app.get("/", function(req, res, next) {
	res.render("index");
});

app.post("/api/login", routes.login);
app.post("/api/login/", routes.login);

app.post("/api/register", routes.register);
app.post("/api/register/", routes.register);

app.post("/api/logout", routes.logout);
app.post("/api/logout/", routes.logout);

app.get("/api/:resource/*", routes.get);
app.get("/api/:resource", routes.get);

app.post("/api/:resource/*", routes.post);
app.post("/api/:resource", routes.post);

app.put("/api/:resource/*", routes.put);
app.put("/api/:resource", routes.put);

app.patch("/api/:resource/*", routes.patch);
app.patch("/api/:resource", routes.patch);

app.delete("/api/:resource/*", routes.delete);
app.delete("/api/:resource", routes.delete);

app.get("/hal/api/:resource/*", routes.get);
app.get("/hal/api/:resource", routes.get);

app.get("/secure/api/:resource/*", routes.get);
app.get("/secure/api/:resource", routes.get);

app.get("/inspect", routes.inspect);
app.post("/inspect", routes.inspect);
app.put("/inspect", routes.inspect);
app.patch("/inspect", routes.inspect);
app.delete("/inspect", routes.inspect);

app.use(function(req, res, next) {
	res.status(404);

	if (req.accepts("html")) {
		res.render("404", {
			url: req.url
		});
		return;
	}

	res.type("txt").send("Not found");
});

let httpsOpts = {
    key: fs.readFileSync('./certs/key.pem'),
    cert: fs.readFileSync('./certs/cert.pem')
};

var httpsServer = https.createServer(httpsOpts, app).listen(httpsPort, function() {
	var host = httpsServer.address().address,
		port = httpsServer.address().port;
	console.log("reqres app listening at https://%s:%s", host, port);
});

var httpServer = http.createServer({}, app).listen(port, function() {
	var host = httpServer.address().address,
		port = httpServer.address().port;
	console.log("reqres app listening at http://%s:%s", host, port);
});


var soapServices = require("./soap/");

for (var serviceName in soapServices) {
	serviceDetails = soapServices[serviceName]
    // FIXME: SOAP listens on http only
	soap.listen(httpServer, '/soap/' + serviceName, serviceDetails.service, serviceDetails.wsdl);
}

module.exports = httpServer
