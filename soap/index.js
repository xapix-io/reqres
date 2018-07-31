var blz_data = require("./../soap-data/blz.json"),
  readFileSync = require('fs').readFileSync;

var BLZService = {
  BLZService: {
    BLZServiceSOAP11port_http: {
      getBank: function(args) {
        return blz_data[args.blz] || {}
      }
    }
  }
};

module.exports = {
  blz: {
    service: BLZService,
    wsdl: readFileSync('./soap-data/BLZServiceSOAP11Only.xml', 'utf8')
  }
}
