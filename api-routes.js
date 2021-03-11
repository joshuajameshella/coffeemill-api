let router = require('express').Router();

// Set default API response
router.get('/', function (req, res) {
    res.json({
        status: 200,
        message: 'Coffee Mill & Cakes API',
    });
});


// Import 'coffee' controller
const coffeeController = require('./coffees/controller');
router.route('/coffee')
    .get(coffeeController.index)
    .post(coffeeController.new);
router.route('/coffee/:coffee_id')
    .get(coffeeController.view)
    .patch(coffeeController.update)
    .put(coffeeController.update)
    .delete(coffeeController.delete);


// Import 'treats' controller
const treatsController = require('./treats/controller');
router.route('/treats')
    .get(treatsController.index)
    .post(treatsController.new);
router.route('/treats/:treat_id')
    .get(treatsController.view)
    .patch(treatsController.update)
    .put(treatsController.update)
    .delete(treatsController.delete);


// Import 'cakes' controller
const cakesController = require('./cakes/controller');
router.route('/cakes')
    .get(cakesController.index)
    .post(cakesController.new);
router.route('/cakes/:cake_id')
    .get(cakesController.view)
    .patch(cakesController.update)
    .put(cakesController.update)
    .delete(cakesController.delete);


// Import 'image' controller
const imageController = require('./image/controller')
router.route('/image')
    .post(imageController.new);
router.route('/image/:image_id')
    .delete(imageController.delete);


// Import 'user' controller
const userController = require('./user/controller')
router.route('/user/login')
    .post(userController.login);


// Import 'message' controller
const messageController = require('./message/controller');
router.route('/message')
    .get(messageController.index)
    .post(messageController.new);
router.route('/message/:message_id')
    .get(messageController.view)
    .delete(messageController.delete);


// Export API routes
module.exports = router;