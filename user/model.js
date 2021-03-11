const mongoose = require('mongoose');

// Setup schema
const userSchema = mongoose.Schema({
    name: {
       type: String,
       required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

// Export User model
const Users = module.exports = mongoose.model('users', userSchema);

module.exports.get = function (callback, limit) {
    Users.find(callback).limit(limit);
}
