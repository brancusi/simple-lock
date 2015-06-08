/* jshint node: true */
/* global require, module */

var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

/*
  This Brocfile specifes the options for the dummy test app of this
  addon, located in `/tests/dummy`

  This Brocfile does *not* influence how the addon or the app using it
  behave. You most likely want to be modifying `./index.js` or app's Brocfile
*/

var app = new EmberAddon();

app.import(app.bowerDirectory + '/ember-simple-auth/simple-auth.js', {
  exports: {
    'simple-auth/authenticators/base':         ['default'],
    'simple-auth/configuration':               ['default']
  },
});

app.import(app.bowerDirectory + '/auth0-lock/build/auth0-lock.js');
app.import(app.bowerDirectory + '/jsrsasign/jsrsasign-latest-all-min.js');


module.exports = app.toTree();
