//During the test the env variable is set to test
process.env.NODE_ENV = 'test'

//Require the dev-dependencies
let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../app')
let should = chai.should()

chai.use(chaiHttp)

describe('GET /api/users', () => {
  it('it should GET all the users', (done) => {
    chai.request(server).get('/api/users').end((err, res) => {
      res.should.have.status(200)
      done()
    })
  })
})
