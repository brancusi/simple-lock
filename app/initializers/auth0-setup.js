import Configuration from 'ember-simple-auth0/configuration';
import Authenticator from 'ember-simple-auth0/authenticators/auth0';

import ENV from '../config/environment';

export default {
  name:       'ember-simple-auth0',
  before:     'simple-auth',
  initialize: function(container, application) {
    Configuration.load(container, ENV['ember-simple-auth0'] || {});
    container.register('simple-auth-authenticator:auth0', Authenticator);
  }
};