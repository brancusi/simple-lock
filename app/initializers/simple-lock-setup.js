import Authenticator from 'simple-lock/authenticators/lock';

export default {
  name:       'simple-lock-setup',
  initialize: function(container, application) {
    container.register('simple-auth-authenticator:lock', Authenticator);
  }
};