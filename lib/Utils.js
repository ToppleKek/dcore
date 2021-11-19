const Constants = require("./Constants");
const util = require("util");

module.exports.use_debug = false;

module.exports.info = function (where, msg) {
    console.log("\033[94mdcore: info (" + where + "):\033[0m " + msg);
}

module.exports.debug = function (where, msg) {
    if (module.exports.use_debug)
        console.log("\033[32mdcore: debug (" + where + "):\033[0m " + msg);
}

module.exports.error = function (where, msg) {
    console.log("\033[91mdcore: error (" + where + "):\033[0m " + msg);
}

module.exports.wait = function (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports.endpoint = function (...args) {
    let ep = "";

    for (let arg of args) {
        if (arg.startsWith("/"))
            ep += arg;
        else
            ep += "/" + arg;
    }

    return ep;
}
