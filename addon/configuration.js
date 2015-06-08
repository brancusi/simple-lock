import loadConfig from 'simple-auth/utils/load-config';

var defaults = {
  domain:                      null,
  clientID:                    null
};

export default {
 
  domain: defaults.domain,

  clientID: defaults.clientID,

  /**
    @method load
    @private
  */
  load: loadConfig(defaults)
};
