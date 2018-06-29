const forward = require('../middleware/forwardCouch');

const CONFIGS_TO_LOAD = {
  config_disable_offline_sync: 'disableOfflineSync',
  config_use_google_auth: 'useGoogleAuth',
  config_log_metrics: 'logNetworkMetrics',
  config_external_search: 'searchURL',
  config_push_public_key: 'pushPublicKey'
};

module.exports = (app, config) => {
  const nano = require('nano')(config.couchAuthDbURL);
  const configDB = nano.use('config');

  function loadConfigs() {
    const configIds = Object.keys(CONFIGS_TO_LOAD);
    configDB.fetch({ keys: configIds }, (err, configValues) => {
      if (err) {
        console.log('Error getting configurations to update', err);
      } else {
        const configsToUpdate = [];
        configValues.rows.forEach((configValue) => {
          const matchingConfig = CONFIGS_TO_LOAD[configValue.key];
          let valueFromConfigFile = config[matchingConfig];
           if (!valueFromConfigFile) {
             valueFromConfigFile = false;
           }

          if (configValue.key === 'config_external_search' &&
              valueFromConfigFile && valueFromConfigFile !== '') {
            valueFromConfigFile = true;
          }

          let dbConfigValue = '';
          if (!configValue.error && configValue.doc) {
            dbConfigValue = configValue.doc.value;
          }

          if (dbConfigValue !== valueFromConfigFile) {
            let docToUpdate = configValue.doc;
            if (!docToUpdate) {
              docToUpdate = {
                _id: configValue.key
              };
            }

            docToUpdate.value = valueFromConfigFile;
            configsToUpdate.push(docToUpdate);
          }
        });
        if (configsToUpdate.length > 0) {
          configDB.bulk({ docs: configsToUpdate }, (_err) => {
            if (err) {
              console.log('Error updating configs:', _err);
            }
          });
        }
      }
    });
  }

  loadConfigs();
  app.use('/db/', forward(config.couchDbURL, config, true));
};
