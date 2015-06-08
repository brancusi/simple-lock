[![Build Status](https://travis-ci.org/brancusi/ember-hub-me.svg?branch=master)](https://travis-ci.org/brancusi/ember-hub-me)

# Warning, very much under flux. Do not use right now.

# Simple-Lock, an ember addon for using Auth0's Lock.js with Ember-Simple-Auth.

Lock.js is a nice way to get a fully functional signup and login workflow into your app. [Auth0](https://auth0.com/).

## What does it do?

* it __wires up Auth0's Lock.js to work with ember simple auth__ using [Auth0](https://auth0.com/) and [Lock](https://auth0.com/docs/lock).
* it __lets you work with ember simple auth__ just like you normally do!

## Installation Ember-CLI

```bash
ember install simple-lock
```

## Blueprints

```bash
ember generate authenticator my-dope-authenticator
```

### Setup your project

## Configuration

There are several configuration options.

1. (REQUIRED) - _clientID_ - Grab from your Auth0 Dashboard
2. (REQUIRED) - _domain_ - Grab from your Auth0 Dashboard

```js
//environment.js
ENV['simple-lock'] = {
  clientID: "auth0_client_id",
  domain: "auth0_domain"
}
```

Setup all your other regular configuration based on the ember-simple-auth docs

## Actions

Once the ```application_route_mixin``` is added to your app route, you will be able to call the following actions:

```html
<!-- app/templates/application.hbs -->
<a {{action 'login'}} href=''>Login</a>
<a {{action 'logout'}} href=''>Logout</a>
<a {{action 'register'}} href=''>Register</a>
```

## Custom Authorizers

There are several hooks you can plug into by extending the simple-lock authorizer.

Here's how:

```bash
ember generate authenticator my-dope-authenticator
```

```js
//authorizers/my-dope-authenticator.js

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
    console.log('Gonna call refresh node son!');
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
    console.log('Gonna call node son!');
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
    console.log('Gonna call refresh node son!');
    return Ember.RSVP.resolve(data);
  }

});

```

If you are using ember-cli, you can then use this as follows:

```js

import Ember from 'ember';
import ApplicationRouteMixin from 'simple-auth/mixins/application-route-mixin';

export default Ember.Route.extend(ApplicationRouteMixin, {
  actions: {
    showAuth0Lock: function(){
      var options = {authParams:{scope: 'openid offline_access'}};

      this.get('session').authenticate('authenticator:my-dope-authenticator', options);
    }
  }
});

```