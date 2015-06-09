import Ember from 'ember';
import ApplicationRouteMixin from 'simple-auth/mixins/application-route-mixin';

export default Ember.Route.extend(ApplicationRouteMixin, {
  actions: {
    sessionRequiresAuthentication: function(){
      // Check out the docs for all the options: 
      // https://auth0.com/docs/libraries/lock/customization
      
      // These options will request a refresh token and launch lock.js in popup mode
      var lockOptions = {authParams:{scope: 'openid offline_access'}};

      this.get('session').authenticate('simple-auth-authenticator:lock', lockOptions);
    }
  }
});