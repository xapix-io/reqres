var express = require("express"),
	bodyParser = require("body-parser"),
	soap = require("strong-soap").soap,
	hbs = require("hbs"),
	path = require("path"),
	cors = require("cors"),
	app = express(),
	port = process.env.PORT || 5000;

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

var server = app.listen(port, function() {
	var host = server.address().address,
		port = server.address().port;
	console.log("reqres app listening at http://%s:%s", host, port);
});

var soapServices = require("./soap/");

for (var serviceName in soapServices) {
	serviceDetails = soapServices[serviceName]
	soap.listen(server, '/soap/' + serviceName, serviceDetails.service, serviceDetails.wsdl);
}

module.exports = server
