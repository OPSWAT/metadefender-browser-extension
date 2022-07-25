const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(
    common, 
    {
        mode: 'production',
        resolve: {
            fallback: { 'path': require.resolve('path-browserify') }
        },
        performance: {
            hints: false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        }
    },
);