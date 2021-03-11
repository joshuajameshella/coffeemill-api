
module.exports = {
    info: function (input) {
        console.log(new Date().toISOString() + " => \t" + input);
    },
    error: function () {
        console.error(new Date().toISOString() + " => \t" + input);
    }
};