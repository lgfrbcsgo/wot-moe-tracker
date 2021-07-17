const HtmlWebpackPlugin = require("html-webpack-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")
const TerserJSPlugin = require("terser-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const path = require("path")

const DIST = path.join(__dirname, "./dist")
const ENTRY = path.join(__dirname, "./src/main.ts")
const TEMPLATE = path.join(__dirname, "./public/index.html")

module.exports = ({ ifDev, ifProd }) => ({
    ...ifDev({
        mode: "development",
        devtool: "eval-source-map",
    }),
    ...ifProd({
        mode: "production",
        devtool: "source-map",
    }),
    output: {
        path: DIST,
        filename: "[name].[fullhash].js",
        ...ifProd({
            publicPath: "/wot-moe-tracker/",
        }),
    },
    devServer: {
        publicPath: "/",
        contentBase: DIST,
        port: 8080,
        historyApiFallback: true,
    },
    entry: ENTRY,
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: { modules: true },
                    },
                    "sass-loader",
                ],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: TEMPLATE,
        }),
        new MiniCssExtractPlugin({
            filename: "[name].[fullhash].css",
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: "static",
            openAnalyzer: false,
        }),
    ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /node_modules/,
                    chunks: "initial",
                    name: "vendor",
                },
            },
        },
        minimizer: [new TerserJSPlugin(), new CssMinimizerPlugin()],
    },
})

module.exports.preserve = value => value
module.exports.ignore = value => (Array.isArray(value) ? [] : {})
