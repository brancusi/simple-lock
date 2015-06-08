/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-simple-auth0',

  included: function(app) {
    this._super.included(app);
    
    app.import(app.bowerDirectory + '/ember-simple-auth/simple-auth.js', {
      exports: {
        'simple-auth/authenticators/base':         ['default'],
        'simple-auth/configuration':               ['default']
      },
    });

    app.import(app.bowerDirectory + '/auth0-lock/build/auth0-lock.js');
    app.import(app.bowerDirectory + '/jsrsasign/jsrsasign-latest-all-min.js');
  },

  isDevelopingAddon: function() {
    return true;
  }
}

