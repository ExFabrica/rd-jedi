const path = require('path');

module.exports = ({ env }) => ({
  'cms-analyzer': {
    resolve: path.resolve(__dirname, '../plugins/cms-analyzer'),
    enabled: true,
    config: {},
  }
});