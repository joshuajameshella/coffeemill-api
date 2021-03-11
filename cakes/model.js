const mongoose = require('mongoose');

// Setup schema
const cakeSchema = mongoose.Schema({
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

// Export Cake model
const Cake = module.exports = mongoose.model('cake', cakeSchema);

// Get all cakes - Reserved for Admin users
module.exports.getAll = function (callback) {
    Cake.find(callback).sort({ priority: 1 });
}

// Get all 'visible' cakes - Accessible by all users
module.exports.getVisible = function (callback) {
    Cake.find({ visible: true }, callback).sort({ priority: 1 });
}
