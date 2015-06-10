# Simple-Lock
## An ember addon for using Auth0's Lock.js with Ember-Simple-Auth.

Auth0's Lock.js is a nice way to get a fully functional signup and login workflow into your app. [Auth0](https://auth0.com/).

## What does it do?

* it __wires up Auth0's Lock.js to work with ember simple auth__ using [Auth0](https://auth0.com/) and [Lock](https://auth0.com/docs/lock).
* it __lets you work with ember simple auth__ just like you normally do! [Ember Simple Auth](https://github.com/simplabs/ember-simple-auth)

## Installation and Setup

### Auth0

If you don't already have an account, go signup at for free: [Auth0](https://auth0.com/)

1. Create a new app through your dashboard.
2. Done!

### Install ember and simple-lock using ember-cli

```bash
ember new hello-safe-world
cd hello-safe-world
ember install simple-lock
```

If you want to get up and running right away, you can scaffold all the neccesary routes with to play with:

```bash
ember generate scaffold-lock
```

### Configuration

There are two configuration options.

1. (REQUIRED) - _clientID_ - Grab from your Auth0 Dashboard
2. (REQUIRED) - _domain_ - Grab from your Auth0 Dashboard

*The below simple-auth config object works out the box with the scaffold*

```js
// config/environment.js
ENV['simple-auth'] = {
  authenticationRoute: 'index',
  routeAfterAuthentication: 'protected',
  routeIfAlreadyAuthenticated: 'protected'
}

ENV['simple-lock'] = {
  clientID: "auth0_client_id",
  domain: "auth0_domain"
}
```

__At this point if you ran *scaffold-lock*, you can fire up ember server:__

```bash
ember server
```
__The below steps will outline the steps to get up and running with the scaffolding:__

### Suggested security config
```js
// config/environment.js

ENV['contentSecurityPolicy'] = {
    'font-src': "'self' data: https://*.auth0.com",
    'style-src': "'self' 'unsafe-inline'",
    'script-src': "'self' 'unsafe-eval' https://*.auth0.com",
    'img-src': '*.gravatar.com *.wp.com data:',
    'connect-src': "'self' http://localhost:* https://your-app-domain.auth0.com"
  };

```

## Manual Setup

Simple-Lock is just a single __authorizer__ that conforms to the ember-simple-auth interface. Please follow the docs to get everything working as usual and just add the call to the *Simple-Lock* __authorizer__ in your ```authenticate``` call.

[Ember Simple Auth](https://github.com/simplabs/ember-simple-auth)

### Actions

Once the standard ember-simple-auth ```application_route_mixin``` is added to your app route, you will be able to use all the usual actions: [Docs](https://github.com/simplabs/ember-simple-auth)

__Here is an example application route:__

```js
// app/routes/application.js

import Ember from 'ember';
import ApplicationRouteMixin from 'simple-auth/mixins/application-route-mixin';

export default Ember.Route.extend(ApplicationRouteMixin, {
  actions: {
    sessionRequiresAuthentication: function(){
      // Check out the docs for all the options: 
      // https://auth0.com/docs/libraries/lock/customization
      
      // These options will request a refresh token and launch lock.js in popup mode by default
      var lockOptions = {authParams:{scope: 'openid offline_access'}};

      this.get('session').authenticate('simple-auth-authenticator:lock', lockOptions);
    }
  }
});
```

__Then from your template you could trigger the usual actions:__

```html
// app/templates/application.hbs

{{#if session.isAuthenticated}}
  <a {{ action 'invalidateSession' }}>Logout</a>
{{else}}
  <a {{ action 'sessionRequiresAuthentication' }}>Login</a>
{{/if}}
```

### Custom Authorizers

You can easily extend the __simple-lock__ base authorizer to play hooky with some cool __hooks__.

Here's how:

```bash
ember generate authenticator my-dope-authenticator
```

This will create the following stub authenticator:

```js
// app/authorizers/my-dope-authenticator.js

import Base from 'simple-lock/authenticators/lock';

export default Base.extend({

  /**
   * Hook that gets called after the jwt has expired
   * but before we notify the rest of the system.
   * Great place to add cleanup to expire any third-party
   * tokens or other cleanup.
   *
   * IMPORTANT: You must return a promise, else logout
   * will not continue.
   * 
   * @return {Promise}
   */
  beforeExpire: function(){
    return Ember.RSVP.resolve();
  },

  /**
   * Hook that gets called after Auth0 successfully
   * authenticates the user.
   * Great place to make additional calls to other
   * services, custom db, firebase, etc. then
   * decorate the session object and pass it along.
   *
   * IMPORTANT: You must return a promise with the 
   * session data.
   * 
   * @param  {Object} data Session object
   * @return {Promise}     Promise with decorated session object
   */
  afterAuth: function(data){
    return Ember.RSVP.resolve(data);
  },

  /**
   * Hook called after auth0 refreshes the jwt
   * based on the refreshToken.
   *
   * This only fires if lock.js was passed in
   * the offline_mode scope params
   *
   * IMPORTANT: You must return a promise with the 
   * session data.
   * 
   * @param  {Object} data The new jwt
   * @return {Promise}     The decorated session object
   */
  afterRestore: function(data){
    return Ember.RSVP.resolve(data);
  },

  /**
   * Hook that gets called after Auth0 successfully
   * refreshes the jwt if (refresh token is enabled).
   * 
   * Great place to make additional calls to other
   * services, custom db, firebase, etc. then
   * decorate the session object and pass it along.
   *
   * IMPORTANT: You must return a promise with the 
   * session data.
   * 
   * @param  {Object} data Session object
   * @return {Promise}     Promise with decorated session object
   */
  afterRefresh: function(data){
    return Ember.RSVP.resolve(data);
  }

});

```

Once you've made your custom authenticator. Just do the following in your app route:

```js
import Ember from 'ember';
import ApplicationRouteMixin from 'simple-auth/mixins/application-route-mixin';

export default Ember.Route.extend(ApplicationRouteMixin, {
  actions: {
    sessionRequiresAuthentication: function(){
      // Check out the docs for all the options: 
      // https://auth0.com/docs/libraries/lock/customization
      
      var lockOptions = {authParams:{scope: 'openid offline_access'}};
      this.get('session').authenticate('simple-auth-authenticator:my-dope-authenticator', lockOptions);
    }
  }
});

```

__Enjoy!__