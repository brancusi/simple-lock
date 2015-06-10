import Authenticator from 'simple-lock/authenticators/lock';

export default {
  name:         'simple-lock-setup',
  before:       'simple-auth',
  initialize: function(registry, application) {
    application.register('simple-auth-authenticator:lock', Authenticator);
  }
};