const config = require("./webpack.config")

module.exports = config({
    ifProd: config.preserve,
    ifDev: config.ignore,
})
