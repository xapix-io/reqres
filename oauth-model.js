
/**
 * Constructor.
 */

function InMemoryCache() {
  this.clients = [{clientId : 'thom', clientSecret : 'nightworld', redirectUris : [''], grants: [
        "client_credentials"
    ] }];
  this.tokens = [];
  this.users = [{ id : '123', username: 'thomseddon', password: 'nightworld' }];
}

/**
 * Dump the cache.
 */

InMemoryCache.prototype.dump = function() {
  console.log("dump")
  console.log('clients', this.clients);
  console.log('tokens', this.tokens);
  console.log('users', this.users);
};

/*
 * Get access token.
 */

InMemoryCache.prototype.getAccessToken = function(bearerToken) {
  console.log("getAccessToken")
  console.log(bearerToken)

  var tokens = this.tokens.filter(function(token) {
    return token.accessToken === bearerToken;
  });

  if (!tokens.length) return false;

  tokens[0].user = this.users[0];

  return tokens.length ? tokens[0] : false;
};

/**
 * Get refresh token.
 */

InMemoryCache.prototype.getRefreshToken = function(bearerToken) {
  console.log("getRefreshToken")
  var tokens = this.tokens.filter(function(token) {
    return token.refreshToken === bearerToken;
  });

  return tokens.length ? tokens[0] : false;
};

/**
 * Get client.
 */

InMemoryCache.prototype.getClient = function(clientId, clientSecret) {
  console.log("getClient")

  var clients = this.clients.filter(function(client) {
    return client.clientId === clientId && client.clientSecret === clientSecret;
  });

  return clients.length ? clients[0] : false;
};

/**
 * Save token.
 */

InMemoryCache.prototype.saveToken = function(token, client, user) {
  console.log("saveToken", arguments)

  this.tokens.push({
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    clientId: client.clientId,
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    userId: user.id
  });

  return { accessToken: token.accessToken, client: client, user: user };
};

/*
 * Get user.
 */

InMemoryCache.prototype.getUser = function(busername, password) {
  console.log("getUser")
  var users = this.users.filter(function(user) {
    return user.username === username && user.password === password;
  });

  return users.length ? users[0] : false;
};

InMemoryCache.prototype.getUserFromClient = function(data, cb) {
  console.log("getUserFromClient")
  cb(null, this.users[0]);

};

/**
 * Export constructor.
 */

module.exports = InMemoryCache;
