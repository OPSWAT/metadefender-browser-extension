const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const webpack = require('webpack');
const configSettings = require('./config/config')();
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
    entry: { popup: './src/index.js', background: './src/services/background/background-task.js' },
    module: {
        rules: [
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
            },
            {
                test: /.s?css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
        symlinks: false
    },
    optimization: {
        minimizer: [
            '...',
            new CssMinimizerPlugin(),
        ],
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
        new HtmlWebpackPlugin({
            template: 'src/components/popup/index.html',
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: './src/manifest.json' },
                { from: './src/components/popup/extension.html' },
                { from: './src/assets/icons/icon-16.png' },
                { from: './src/assets/icons/icon-19.png' },
                { from: './src/assets/icons/icon-38.png' },
                { from: './src/assets/icons/icon-128.png' },
                { from: './src/assets/images/', to: 'images' },
                { from: './src/_locales', to: '_locales' },
            ],
        }),
        new webpack.ProvidePlugin({
            'React': 'react',
        }),
        new Dotenv()
    ],
    output: { filename: '[name].js', path: path.resolve(__dirname, 'dist') }
};