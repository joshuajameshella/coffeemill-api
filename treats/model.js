const mongoose = require('mongoose');

// Setup schema
const treatSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: Number,
        required: true
    },
    visible: {
        type: Boolean,
        required: true
    },
    update_date: {
       type: Date,
       default: Date.now
    },
    create_date: {
        type: Date,
        default: Date.now
    }
});

// Export Treat model
const Treat = module.exports = mongoose.model('treat', treatSchema);

// Get all treats - Reserved for Admin users
module.exports.getAll = function (callback) {
    Treat.find(callback).sort({ priority: 1 });
}

// Get all 'visible' treats - Accessible by all users
module.exports.getVisible = function (callback) {
    Treat.find({ visible: true }, callback).sort({ priority: 1 });
}
