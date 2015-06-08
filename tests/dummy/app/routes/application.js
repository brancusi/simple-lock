import Ember from 'ember';
import ApplicationRouteMixin from 'simple-auth/mixins/application-route-mixin';

export default Ember.Route.extend(ApplicationRouteMixin, {
  actions: {
    showAuth0Lock: function(){
      var options = {authParams:{scope: 'openid offline_access'}};

      this.get('session').authenticate('authenticator:auth0', options);
    }
  }
});