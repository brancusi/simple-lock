import Ember from 'ember';
import Base from 'simple-auth/authenticators/base';

var read = Ember.computed.readOnly;
var bool = Ember.computed.bool;

export default Base.extend({
  
  _lock: null,
  _scheduledJobCollection: Ember.A(),
  _sessionData: Ember.Object.create(),

  domain: null,

  clientID: null,

  /**
    @method init
    @private
  */
  init: function() {
    var applicationConfig = this.container.lookupFactory('config:environment');
    var config = applicationConfig['ember-simple-auth0'];

    var lock = new Auth0Lock(config.clientID, config.domain);
    this.set('_lock', lock);
  },

  /**
   * The auth0 userID.
   * @return {String}
   */
  userID: read('_sessionData.profile.user_id'),

  /**
   * The access token.
   * @return {String}
   */
  accessToken: read('_sessionData.accessToken'),

  /**
   * The refresh token used to refresh the temporary access key.
   * @return {String}
   */
  refreshToken: read('_sessionData.refreshToken'),

  /**
   * Is there currently a refresh token
   * @return {Boolean}
   */
  hasRefreshToken: bool('refreshToken'),

  /**
   * The current session JWT.
   * @return {Base64 url encoded JWT}
   */
  jwt: read('_sessionData.jwt'),

  /**
   * Is the currently a jwt in store
   * @return {Boolean}
   */
  hasJWT: Ember.computed('jwt', function(){
    return !Ember.isBlank(this.get('jwt'));
  }),

  /**
   * Hook called before triggering the invalidate in simple auth
   * @return {Promise}
   */
  beforeExpire: function(){
    return Ember.RSVP.resolve();
  },

  /**
   * The last token refresh expire time
   * @return {Number in seconds}
   */
  expiresIn: function(){
    if(Ember.isEmpty(this.get('jwt'))){
      return 0;
    }else{
      return this._extractExpireTime(this.get('jwt'));
    }
  }.property('_sessionData.jwt'),

  restore: function(data) {
    this.get('_sessionData').setProperties(data);

    if(this._jwtRemainingTime() < 1){
      if(this.get('hasRefreshToken')){
        return this._refreshAuth0Token();
      }else{
        return Ember.RSVP.reject();
      }
    }else{
      return Ember.RSVP.resolve(this._setupFutureEvents());
    }
  },

  authenticate: function(options) {
    var self = this;
    return new Ember.RSVP.Promise(function(resolve, reject) {
      self.get('_lock').show(options, function(err, profile, jwt, accessToken, state, refreshToken) {
        if(err){
          reject(err);
        }else{

          var sessionData = {
            profile:profile,
            jwt:jwt,
            accessToken:accessToken,
            refreshToken:refreshToken
          };

          resolve(self._setupFutureEvents(sessionData));
        }
        
      });
    });

  },

  invalidate: function(/* data */) {
    var headers = {"Authorization": "Bearer " + this.get('jwt')};
    
    var url = "https://mlvk.auth0.com/api/users/"+this.get('userID')+"/refresh_tokens/"+this.get('refreshToken');
    
    var self = this;

    return Ember.$.ajax(url, {type:"DELETE", headers:headers}).then(function(){
      return self.beforeExpire();
    });
  },

  //=======================
  // Private Methods
  //=======================
  _setupFutureEvents: function(data){
    this.get('_sessionData').setProperties(data);

    // Just got a new lease on life so let's clear all old jobs
    this._clearJobQueue();

    // Death comes to all of us, setup the expiration
    this._scheduleExpire();

    // There is hope, if a refresh token exists, we may just find immortality
    if(this.get('hasRefreshToken')){
      this._scheduleRefresh();
    }

    return this.get('_sessionData');
  },

  _scheduleRefresh: function(){
    var remaining = this._jwtRemainingTime();
    if(remaining < 5){
      this._scheduleJob(this, this._refreshAccessToken, 0);  
    }else{
      this._scheduleJob(this, this._refreshAccessToken, (remaining-5)*1000);
    }
  },

  _scheduleExpire: function(){
    this._scheduleJob(this, this._processSessionExpired, this._jwtRemainingTime()*1000);
  },

  _scheduleJob: function(scope, callback, time){
    var job = Ember.run.later(scope, callback, time);
    this.get('_scheduledJobCollection').addObject(job);
  },

  _clearJobQueue: function(){

    var queue = this.get('_scheduledJobCollection');
    queue.forEach(function(job){
      Ember.run.cancel(job);
    });

    queue.clear();
  },

  _processSessionExpired: function(){
    var self = this;
    this.beforeExpire().then(function(){
      self.trigger('sessionDataInvalidated');
    });
  },

  _refreshAuth0Token: function(){
    var self = this;
    return new Ember.RSVP.Promise(function(resolve, reject) {
      self.get('_lock').getClient().refreshToken(self.get('refreshToken'), function (err, result) {
        if(err){
          reject(err);
        }else{
          resolve(self._setupFutureEvents({jwt:result.id_token}));
        }
      });
    });
  },

  _refreshAccessToken:function(){
    var self = this;
    this._refreshAuth0Token().then(function(data){
      self.trigger('sessionDataUpdated', data);
    });
  },

  //=======================
  // Utility Methods
  //=======================
  _extractExpireTime: function(jwt){
    var claim = b64utos(jwt.split(".")[1]);
    var decoded = KJUR.jws.JWS.readSafeJSONString(claim);
    return decoded.exp;
  },

  _jwtRemainingTime: function(){
    if(this.get('expiresIn') <= 0){
      return 0;
    }else{
      var currentTime = (new Date().getTime()/1000);
      return this.get('expiresIn') - currentTime;  
    }
  }

});