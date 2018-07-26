ReqRes
======

ReqRes is a bare-bones ExpressJS application.

[Docs & Demos ⇒](http://reqres.in)

## Installation

* Clone repo
* Make sure Node.js is installed on your machine
* `npm install`
* Make sure you have Gulp installed globally (only needed for asset compilation)
* `node app.js` or use [Nodemon](https://github.com/remy/nodemon)
* Run `gulp` if you're modifying the Sass

## Tour

* [app.js](https://github.com/benhowdle89/reqres/blob/master/app.js) - this is where we create the Express app and define all of our routes
* [index.js](https://github.com/benhowdle89/reqres/blob/master/routes/index.js) - this is the main file for the callback routes
* [config.json](https://github.com/benhowdle89/reqres/blob/master/config.json) - this houses the pagination details & fake session token
* [data.json](https://github.com/benhowdle89/reqres/blob/master/data.json) - this holds the fake data. This is where you would add a new key to the array and then you could define a callback route for it in `routes/index.js`

## SOAP mocking note

Underlying `strong-soap` can't handle multiple soap versions in WSDL
properly, i.e. you'll get an error in response.

| Service (see app.js)      | SOAP11Only WSDL    | SOAP12Only WSDL    | SOAP11, SOAP12 WSDL |
| ------------------------- | ---------------    | ---------------    | ------------------- |
| soap11                    | :heavy_check_mark: | :x:                | :x:                 |
| soap12                    | :x:                | :heavy_check_mark: | :heavy_check_mark:  |

See `app.js` soap service declaration and `examples/soap-data` folder for
corresponding WSDLs.

SOAP `curl` request example:

```sh
curl -H "Content-Type: text/xml; charset=utf-8" \
     -H "SOAPAction:getBank" \
     -d@./examples/soap-data/BLZServiceRequest.xml \
     "http://localhost:5000/soap/blz"

```
