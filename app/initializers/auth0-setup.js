import Authenticator from 'ember-simple-auth0/authenticators/auth0';

export default {
  name:       'ember-simple-auth0',
  initialize: function(container, application) {
    container.register('simple-auth-authenticator:auth0', Authenticator);
  }
};