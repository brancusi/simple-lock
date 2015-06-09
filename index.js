/* jshint node: true */
'use strict';

module.exports = {
  name: 'simple-lock',

  included: function(app) {
    app.import(app.bowerDirectory + '/ember-simple-auth/simple-auth.amd.js');
    app.import(app.bowerDirectory + '/auth0-lock/build/auth0-lock.js');
    app.import(app.bowerDirectory + '/jsrsasign/jsrsasign-latest-all-min.js');
  },

  isDevelopingAddon: function() {
    return false;
  }

}