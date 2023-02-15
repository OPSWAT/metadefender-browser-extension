const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');
const configSettings = require('./config/config')();

module.exports = {
    webpack: (config) => {
        config.entry = {
            popup: './index.js',
            background: {
                import: './services/background/index.js',
                filename: 'background.js'
            }
        };

        config.module.rules = [
            {
                test: /\.js?$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env', '@babel/preset-react'],
                        }
                    }
                ],
                exclude: [/node_modules/]
            },
            {
                test: /\.scss$/,
                exclude: [/node_modules/],
                include: [
                    path.resolve(__dirname, 'src'),
                ],
                use: ['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    }
                ]
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                exclude: [/node_modules/],
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                            outputPath: 'images/'
                        }
                    }
                ]
            },
            {
                test: /\.(woff(2)?|ttf|eot|otf)(\?v=\d+\.\d+\.\d+)?$/,
                exclude: [/node_modules/],
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'fonts/'
                        }
                    }
                ]
            },
            {
                test: /\.jsx?$/,
                exclude: [/node_modules/],
                use: {
                    loader: require.resolve('preprocess-loader'),
                    options: configSettings,
                },
            }
        ];

        config.resolve = {
            extensions: ['.js'],
            symlinks: false
        };

        config.plugins = [
            ...config.plugins,
            new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
            new HtmlWebpackPlugin({
                template: 'components/popup/index.html',
                excludeChunks: [
                    'background'
                ]
            }),
            new CopyWebpackPlugin({
                patterns: [
                    { from: './manifest.json' },
                    { from: './components/popup/extension.html' },
                    { from: './assets/icons/icon-16.png' },
                    { from: './assets/icons/icon-19.png' },
                    { from: './assets/icons/icon-38.png' },
                    { from: './assets/icons/icon-128.png' },
                    { from: './assets/images/', to: 'images' },
                    { from: './_locales', to: '_locales' },
                ],
            }),
            new webpack.ProvidePlugin({
                'React': 'react',
            }),
            new Dotenv()
        ];

        config.resolve.fallback = { 'path': require.resolve('path-browserify') };

        return config;
    }
};
