import Authenticator from 'simple-lock/authenticators/lock';

export default {
  name:       'simple-lock-setup',
  before:       'simple-auth',
  initialize: function(container, application) {
    container.register('simple-auth-authenticator:lock', Authenticator);
  }
};