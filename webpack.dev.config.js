const config = require("./webpack.config")

module.exports = config({
    ifProd: config.ignore,
    ifDev: config.preserve,
})
