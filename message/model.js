const mongoose = require('mongoose');

// Setup schema
const messageSchema = mongoose.Schema({
    name: {
       type: String,
       required: false
    },
    contactInfo: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    viewed: {
        type: Boolean,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Export Message model
const Message = module.exports = mongoose.model('message', messageSchema);

module.exports.getAll = function (callback, limit) {
    Message.find(callback).limit(limit).sort({ timestamp: -1 });
}
