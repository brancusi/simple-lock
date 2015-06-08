import Ember from 'ember';
import Base from 'simple-auth/authenticators/base';

var read = Ember.computed.readOnly;
var bool = Ember.computed.bool;

export default Base.extend({
  
  /**
   * The session data
   * @type {Ember Object}
   */
  sessionData: read('_sessionData'),

  /**
   * The job queue
   * @type {Ember Array}
   */
  scheduledJobCollection: read('_scheduledJobCollection'),

  /**
   * The env config found in the environment config.
   * ENV['simple-lock']
   * 
   * @type {Object}
   */
  config: read('_config'),
  /**
   * Auth0 Lock Instance
   * @type {Auth0Lock}
   */
  lock: read('_lock'),
  
  /**
   * The Auth0 App ClientID found in your Auth0 dashboard
   * @type {String}
   */
  clienID: read('_clientID'),
  
  /**
   * The Auth0 App Domain found in your Auth0 dashboard
   * @type {String}
   */
  domain: read('_domain'),
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
   * Is there currently a jwt?
   * @return {Boolean}
   */
  hasJWT: Ember.computed('jwt', function(){
    return !Ember.isBlank(this.get('jwt'));
  }),

  init: function() {
    var applicationConfig = this.container.lookupFactory('config:environment');

    var config = applicationConfig['simple-lock'];
    this.set('_config', config);

    this.set('_sessionData', Ember.Object.create());
    this.set('_scheduledJobCollection', Ember.A());

    this.set('_clientID', config.clientID);
    this.set('_domain', config.domain);

    var lock = new Auth0Lock(this.get('clientID'), this.get('domain'));
    this.set('_lock', lock);
  },

  /**
   * Hook called before triggering the invalidate in simple auth
   * @return {Promise}
   */
  beforeExpire: function(){
    return Ember.RSVP.resolve();
  },

  /**
   * Hook called after auth0 has authenticated but before
   * the simple-auth completes session creation.
   * This is a great place to decorate the session object.
   * 
   * @return {Promoise} With the decorated session object
   */
  afterAuth: function(data){
    return Ember.RSVP.resolve(data);
  },

  /**
   * Hook called after auth0 has refreshed the jwt but before
   * the simple-auth triggers the sessionUpdated event.
   * This is a great place to decorate the session object.
   * 
   * @return {Promoise} With the decorated session object
   */
  afterRefresh: function(data){
    return Ember.RSVP.resolve(data);
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
  }.property('sessionData.jwt'),

  restore: function(data) {
    this.get('sessionData').setProperties(data);

    if(this._jwtRemainingTime() < 1){
      if(this.get('hasRefreshToken')){
        return this._refreshAuth0Token();
      }else{
        return Ember.RSVP.reject();
      }
    }else{
      return self.afterAuth(sessionData)
            .then(function(response){
              return Ember.RSVP.resolve(this._setupFutureEvents(response));
            });
    }
  },

  authenticate: function(options) {
    var self = this;
    return new Ember.RSVP.Promise(function(resolve, reject) {
      self.get('lock').show(options, function(err, profile, jwt, accessToken, state, refreshToken) {
        if(err){
          reject(err);
        }else{
          var sessionData = {
            profile:profile,
            jwt:jwt,
            accessToken:accessToken,
            refreshToken:refreshToken
          };

          self.afterAuth(sessionData)
          .then(function(response){
            resolve(self._setupFutureEvents(response));  
          });
        }
      });

    });

  },

  invalidate: function(/* data */) {
    var headers = {'Authorization':'Bearer ' + this.get('jwt')};
    
    var url = 'https://'+this.get('domain')+'/api/users/'+this.get('clientID')+'/refresh_tokens/'+this.get('refreshToken');
    
    var self = this;

    return Ember.$.ajax(url, {type:"DELETE", headers:headers}).then(function(){
      return self.beforeExpire();
    });
  },

  //=======================
  // Private Methods
  //=======================
  _setupFutureEvents: function(data){
    this.get('sessionData', data).setProperties(data);

    // Just got a new lease on life so let's clear all old jobs
    this._clearJobQueue();

    // Death comes to all of us, setup the expiration
    this._scheduleExpire();

    // There is hope, if a refresh token exists, we may just find immortality
    if(this.get('hasRefreshToken')){
      this._scheduleRefresh();
    }

    return this.get('sessionData');
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
      self.get('lock').getClient().refreshToken(self.get('refreshToken'), function (err, result) {
        if(err){
          reject(err);
        }else{
          self.afterRefresh({jwt:result.id_token})
          .then(function(response){
            resolve(self._setupFutureEvents(response));  
          });
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