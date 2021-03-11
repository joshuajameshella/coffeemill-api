const mongoose = require('mongoose');

// Setup schema
const coffeeSchema = mongoose.Schema({
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

// Export Coffee model
const Coffee = module.exports = mongoose.model('coffee', coffeeSchema);

// Get all coffees - Reserved for Admin users
module.exports.getAll = function (callback) {
    Coffee.find(callback).sort({ priority: 1 });
}

// Get all 'visible' coffees - Accessible by all users
module.exports.getVisible = function (callback) {
    Coffee.find({ visible: true }, callback).sort({ priority: 1 });
}
