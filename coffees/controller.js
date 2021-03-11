const logger = require('../logger/logger');
const userController = require('../user/controller');
const NodeCache = require( "node-cache" );

// Create a new cache for 'coffee' data, with a 30 minute memory
const coffeesCache = new NodeCache();
const cacheTimeout = 1800;

// Import 'coffee' model
Coffee = require('./model');

// getAllCoffees returns a list of every coffee in the database. Should only be used by Admin users.
function getAllCoffees(callback) {

    // Check whether the ADMIN data exists in cache memory, to prevent unnecessary database queries
    let coffees = coffeesCache.get( "allCoffees" );
    if ( coffees === undefined ) {

        // If data does not exist in cache, attempt to query the database, and store the results in cache memory
        Coffee.getAll(function (err, coffees) {
            if (!err) {
                // If no error occurred, save the coffee data in cache memory
                coffeesCache.set( "allCoffees", coffees, cacheTimeout );
            }
            return callback(err, coffees);
        });
    } else {
        return callback(null, coffees);
    }
}

// getVisibleCoffees returns a list of all 'visible' coffees in the database. Can be used by all users.
function getVisibleCoffees(callback) {

    // Check whether the ADMIN data exists in cache memory, to prevent unnecessary database queries
    let coffees = coffeesCache.get( "visibleCoffees" );
    if ( coffees === undefined ) {

        // If data does not exist in cache, attempt to query the database, and store the results in cache memory
        Coffee.getVisible(function (err, coffees) {
            if (!err) {
                // If no error occurred, save the coffee data in cache memory
                coffeesCache.set( "visibleCoffees", coffees, cacheTimeout );
            }
            return callback(err, coffees);
        });
    } else {
        return callback(null, coffees);
    }
}

// Handle index actions. Retrieves all 'coffees' in the database
exports.index = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {
            getAllCoffees(function (err, coffees) {
                if (err) {
                    return res.status(500).json({ data: err });
                }
                return res.status(200).json({ data: coffees });
            });
        } else {
            // If no roles are present in the JWT, return an 'Unauthorized' API response
            return res.status(403).json({ data: 'Unauthorized user action' });
        }
    } else {
        // If no Authorization header is sent with the request, return only 'visible' products
        // Check whether the 'visible' data exists in cache memory, to prevent unnecessary database queries
        let visibleCoffees = coffeesCache.get( "visibleCoffees" );
        if ( visibleCoffees === undefined ) {
            getVisibleCoffees(function (err, coffees) {
                if (err) {
                    return res.status(500).json({ data: err });
                }
                return res.status(200).json({ data: coffees });
            });
        } else {
            // Return all 'visible' coffee data to regular user
            return res.status(200).json({ data: visibleCoffees });
        }
    }
};

// Handle create coffee actions. Takes the coffee data & adds a new record to the database
exports.new = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {
            getAllCoffees(function (err, coffees) {
                if (err) {
                    return res.status(500).json({ data: err });
                }

                // Calculate the product order based on existing products
                let productPriority = 1;
                if (coffees.length > 0) {
                    productPriority = coffees[coffees.length - 1].priority + 1
                }

                const coffee = new Coffee();
                coffee.name = req.body.name ? req.body.name : "";
                coffee.price = req.body.price ? req.body.price : "0.00";
                coffee.image = req.body.image ? req.body.image : "";
                coffee.description = req.body.description ? req.body.description : "";
                coffee.priority = productPriority;
                coffee.visible = req.body.visible ? req.body.visible : false;

                // save the coffee and check for errors
                coffee.save(function (err) {
                    if (err) {
                        return res.status(500).json({ data: err });
                    }

                    // Delete existing cache data, so changes will have immediate effect on next request.
                    coffeesCache.del([ 'allCoffees', 'visibleCoffees' ]);

                    // Log the change, and return a 'success' response to the user
                    logger.info(request.user + " added the following coffee : " + coffee.name + ' { id: ' + coffee._id + " } ");
                    return res.status(201).json({ data: coffee });
                });
            });
        } else {
            // If no roles are present in the JWT, return an 'Unauthorized' API response
            return res.status(403).json({ data: 'Unauthorized user action' });
        }
    } else {
        // If no roles are present in the JWT, return an 'Unauthorized' API response
        return res.status(401).json({ data: 'Request missing Authorization header' });
    }
};

// Handle view coffee info. Takes the ID sent in the request, and returns the matching database record
exports.view = function (req, res) {
    Coffee.findById(req.params.coffee_id, function (err, coffee) {
        if (err)
            return res.status(500).send({ data: err });
        res.status(200).json({ data: coffee });
    });
};

// Handle update coffee info. Takes the ID & new data sent in the request, and updates the database record
exports.update = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {

            Coffee.findById(req.params.coffee_id, function (err, coffee) {
                if (err) {
                    return res.status(500).send({ data: err });
                }

                coffee.name = req.body.name ? req.body.name : coffee.name;
                coffee.price = req.body.price ? req.body.price : coffee.price;
                coffee.image = req.body.image ? req.body.image : coffee.image;
                coffee.description = req.body.description ? req.body.description : coffee.description;
                coffee.priority = req.body.priority ? req.body.priority : coffee.priority;
                coffee.visible = req.body.visible;
                coffee.update_date = Date.now();

                // Save the coffee updated data
                coffee.save(function (err) {
                    if (err) {
                        return res.status(500).json({ data: err });
                    }

                    // Delete existing cache data, so changes will have immediate effect on next request.
                    coffeesCache.del([ 'allCoffees', 'visibleCoffees' ]);

                    // Log the change, and return a 'success' response to the user
                    logger.info(request.user + " updated the " + coffee.name + " product data");
                    return res.status(200).json({ data: coffee });
                });
            });
        } else {
            // If no roles are present in the JWT, return an 'Unauthorized' API response
            return res.status(403).json({ data: 'Unauthorized user action' });
        }
    } else {
        // If no roles are present in the JWT, return an 'Unauthorized' API response
        return res.status(401).json({ data: 'Request missing Authorization header' });
    }
};

// Handle delete coffee. Takes the record ID, iterates all other database records, before removing record.
exports.delete = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {
            const recordID = req.params.coffee_id;

            // Find the record to be deleted, and increment the priority rating of all following records by 1
            getAllCoffees(function (err, coffees) {
                if (err) {
                    return res.status(500).json({data: err});
                }

                // Find the product position in the database
                const listPosition = coffees.indexOf(coffees.find( element => element.id === recordID ));

                // for all database records after the deleted item, increment their priority rating by 1
                for (let i = listPosition + 1; i < coffees.length; i++) {
                    Coffee.findById(coffees[i].id, function (err, coffee) {
                        if (!err) {
                            coffee.priority = coffees[i].priority - 1;
                            coffee.save();
                        }
                    });
                }
            });

            // Delete the record from the database
            Coffee.deleteOne({_id: recordID}, function (err, coffee) {
                if (err) {
                    return res.status(500).json({ data: err });
                }

                // Delete existing cache data, so changes will have immediate effect on next request.
                coffeesCache.del([ 'allCoffees', 'visibleCoffees' ]);

                // Log the change, and return a 'success' response to the user
                logger.info(request.user + ' deleted the following coffee : { id: ' + recordID + ' } ');
                return res.status(200).json({ data: coffee });
            });
        } else {
            // If no roles are present in the JWT, return an 'Unauthorized' API response
            return res.status(403).json({ data: 'Unauthorized user action' });
        }
    } else {
        // If no roles are present in the JWT, return an 'Unauthorized' API response
        return res.status(401).json({ data: 'Request missing Authorization header' });
    }
};
