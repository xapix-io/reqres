var blz_data = require("./../soap-data/blz.json"),
  readFileSync = require('fs').readFileSync;

var soapErrors = {
    soap11: {
        Fault: {
            faultcode: "sampleFaultCode",
            faultstring: "sampleFaultString",
            detail:
            { myMethodFault:
              {errorMessage: 'MyMethod Business Exception message', value: 10}
            }
        }
    },
    soap12: {
        Fault: {
            Code: {
                Value: "soap:Sender",
                Subcode: { Value: "rpc:BadArguments" }
            },
            Reason: { Text: "Processing Error" },
            Detail:
            {myMethodFault2:
             {errorMessage2: 'MyMethod Business Exception message', value2: 10}
            }
        }
    }
}

var BLZService = {
  BLZService: {
    BLZServiceSOAP11port_http: {
      getBank: function(args) {
        if (args.error) {
          throw soapErrors[args.error]
        } else {
          if (args.blz == 'soap11fault') {
            throw soapErrors.soap11
          }
          else if (args.blz == 'soap12fault') {
            throw soapErrors.soap12
          }
          else {
            data = blz_data[args.blz]
            if (!data) throw soapErrors.soap11
            return blz_data[args.blz]
          }
        }
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
