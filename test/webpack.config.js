module.exports = {
    module: {
        rules: [{
            test: /\.js$/,
            exclude: [
                /node_modules/,
                /\.spec\.js$/
            ],
            loader: 'istanbul-instrumenter-loader',
            options: {
                esModules: true
            }
        }]
    }
};