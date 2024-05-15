'use strict';

if (!global.__basedir) {
    global.__basedir = __dirname + '/../';
}

const common = require(__basedir + '/config/common.json');

const env = require(__basedir + '/config/' + 'qa' + '.json');
const fs = require('fs');

module.exports = exports = function(_) {
    let configFiles = Object.assign({}, common, env);

    if (fs.existsSync(__basedir + '/config/local.json') && process.env.ENVIRONMENT === 'local') {
        const dev = require(__basedir + '/config/local.json');
        configFiles = Object.assign(configFiles, dev);
    }

    configFiles = Object.assign(configFiles, process.env);
    //
    // Iterate trough all values and convert to boolean where applicable
    //
    Object.keys(configFiles).forEach((key) => {
        if (configFiles[key] === 'true' || configFiles[key] === 'false') {
            configFiles[key] = configFiles[key] === 'true';
        }
    });

    return configFiles;
};
