import gulp from 'gulp';
import fs from 'fs';
import args from './lib/args';

const env = () => args.local ? 'local' : (args.qa ? 'qa' : (args.dev ? 'dev' : (args.prod ? 'prod' : null)));

const merge = function(dest, source) {
    for (let key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key) === true) {
            dest[key] = source[key];
        }
    }
    return dest;
};

gulp.task('config', function(cb) {

    if (!env()) {
        console.log('\nError: Missing environment token!');
        console.log('\nUsage: gulp config --prod|qa|dev|local\n');
        return;
    }

    const confCommon = JSON.parse(fs.readFileSync('./app/config/common.json'));
    let config = merge(confCommon, {});
    
    try {
        const confEnv = JSON.parse(fs.readFileSync(`./app/config/${env()}.json`));
        config = merge(confCommon, confEnv);
    }
    catch (error) {
        console.log('\nINFO: Using common config!\n');
    }

    try {
        const confSecrets = JSON.parse(fs.readFileSync('./secrets.json'));
        config = merge(config, confSecrets);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            console.log('\nWARNING: secrets.json is missing! See ./README.md for more info.\n');
        }
        else {
            console.log(error);
        }
    }

    config.env = env();

    config = JSON.stringify(confCommon, null, '    ');
    config = `window.MCL = {"config": ${config}};`;

    fs.writeFileSync('./app/scripts/common/config.js', config);

    cb();
});
