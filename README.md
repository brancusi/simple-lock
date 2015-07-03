# Auth0 Ember simple auth
### An ember-cli addon for using [Auth0](https://auth0.com/) with [Ember Simple Auth](https://github.com/simplabs/ember-simple-auth).

Auth0's [lock](https://github.com/auth0/lock) widget, is a nice way to get a fully functional signup and login workflow into your app.

## What does it do?

* it __wires up Auth0's Lock.js to work with ember simple auth__.
* it __lets you work with ember simple auth__ just like you normally do!

## Installation and Setup

### Auth0

If you don't already have an account, go signup at for free: [Auth0](https://auth0.com/)

1. Create a new app through your dashboard.
2. Done!

### Generate a new ember app and install `auth0-ember-simple-auth` using ember-cli (Ember CLI >= 0.2.7)

```bash
ember new hello-safe-world
cd hello-safe-world
ember install auth0-ember-simple-auth
```

If you want to get up and running right away, you can scaffold all the necessary routes with to play with:

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
ember server --port
```
__The below steps will outline the steps to get up and running with the scaffolding:__

### Suggested security config

Ember uses a [content security policy](http://www.html5rocks.com/en/tutorials/security/content-security-policy/) to manage which resources are allowed to be run on your pages.

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

### Caveats

1. Because ember simple auth listens for local storage changes, updates in one tab will trigger token refreshes in all open tabs of the same domain. This is not critical for long lived JWTs but will be noticeable if there are several tabs of the app running on the same browser with very short lived JWTs.
*I'm open to suggestions on getting around this.*


## Manual Setup

__auth0-ember-simple-auth__ is just a regular __authorizer__ that conforms to the [Ember Simple Auth](https://github.com/simplabs/ember-simple-auth) interface. Please follow the docs to get everything working as usual, and just add the call to the *simple-auth-authenticator:lock* __authorizer__ in your ```authenticate``` call.

### Actions

Once the standard [Ember Simple Auth](https://github.com/simplabs/ember-simple-auth) ```application_route_mixin``` is added to your app route, you will be able to use all the usual actions: [Docs](https://github.com/simplabs/ember-simple-auth)

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

### Custom Authenticators

You can easily extend the __Simple Lock__ base __authenticator__ to play hooky with some cool __hooks__.

Here's how:

```bash
ember generate authenticator my-dope-authenticator
```

This will create the following stub authenticator:

```js
// app/authenticators/my-dope-authenticator.js

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
## Credits

Written by @brancusi (Aram Zadikian), maintained in part by Auth0. Thanks Aram!

## License

auth0-ember-simple-auth by Aram Zadikian. It is released under the MIT License.

__Enjoy!__
