const logger = require('../logger/logger');
const userController = require('../user/controller');
const NodeCache = require( "node-cache" );

// Create a new cache for 'cake' data, with a 30 minute memory
const cakesCache = new NodeCache();
const cacheTimeout = 1800;

// Import 'cake' model
Cake = require('./model');

// getAllCakes returns a list of every cake in the database. Should only be used by Admin users.
function getAllCakes(callback) {

    // Check whether the ADMIN data exists in cache memory, to prevent unnecessary database queries
    let cakes = cakesCache.get( "allCakes" );
    if ( cakes === undefined ) {

        // If data does not exist in cache, attempt to query the database, and store the results in cache memory
        Cake.getAll(function (err, cakes) {
            if (!err) {
                // If no error occurred, save the cakes data in cache memory
                cakesCache.set( "allCakes", cakes, cacheTimeout );
            }
            return callback(err, cakes);
        });
    } else {
        return callback(null, cakes);
    }
}

// getVisibleCakes returns a list of all 'visible' cakes in the database. Can be used by all users.
function getVisibleCakes(callback) {

    // Check whether the ADMIN data exists in cache memory, to prevent unnecessary database queries
    let cakes = cakesCache.get( "visibleCakes" );
    if ( cakes === undefined ) {

        // If data does not exist in cache, attempt to query the database, and store the results in cache memory
        Cake.getVisible(function (err, cakes) {
            if (!err) {
                // If no error occurred, save the cakes data in cache memory
                cakesCache.set( "visibleCakes", cakes, cacheTimeout );
            }
            return callback(err, cakes);
        });
    } else {
        return callback(null, cakes);
    }
}

// Handle index actions. Retrieves all 'cakes' in the database
exports.index = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {
            getAllCakes(function (err, cakes) {
                if (err) {
                    return res.status(500).json({ data: err });
                }
                return res.status(200).json({ data: cakes });
            });
        } else {
            // If no roles are present in the JWT, return an 'Unauthorized' API response
            return res.status(403).json({ data: 'Unauthorized user action' });
        }
    } else {
        // If no Authorization header is sent with the request, return only 'visible' products
        // Check whether the 'visible' data exists in cache memory, to prevent unnecessary database queries
        let visibleCakes = cakesCache.get( "visibleCakes" );
        if ( visibleCakes === undefined ) {
            getVisibleCakes(function (err, cakes) {
                if (err) {
                    return res.status(500).json({ data: err });
                }
                return res.status(200).json({ data: cakes });
            });
        } else {
            // Return all 'visible' cake data to regular user
            return res.status(200).json({ data: visibleCakes });
        }
    }
};

// Handle create cake actions. Takes the cake data & adds a new record to the database
exports.new = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {
            getAllCakes(function (err, cakes) {
                if (err) {
                    return res.status(500).json({ data: err });
                }

                // Calculate the product order based on existing products
                let productPriority = 1;
                if (cakes.length > 0) {
                    productPriority = cakes[cakes.length - 1].priority + 1
                }

                const cake = new Cake();
                cake.name = req.body.name ? req.body.name : "";
                cake.price = req.body.price ? req.body.price : "0.00";
                cake.image = req.body.image ? req.body.image : "";
                cake.description = req.body.description ? req.body.description : "";
                cake.priority = productPriority;
                cake.visible = req.body.visible ? req.body.visible : false;

                // save the cake and check for errors
                cake.save(function (err) {
                    if (err) {
                        return res.status(500).json({ data: err });
                    }

                    // Delete existing cache data, so changes will have immediate effect on next request.
                    cakesCache.del([ 'allCakes', 'visibleCakes' ]);

                    // Log the change, and return a 'success' response to the user
                    logger.info(request.user + " added the following cake : " + cake.name + ' { id: ' + cake._id + " } ");
                    return res.status(201).json({ data: cake });
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

// Handle view cake info. Takes the ID sent in the request, and returns the matching database record
exports.view = function (req, res) {
    Cake.findById(req.params.cake_id, function (err, cake) {
        if (err)
            return res.status(500).send({ data: err });
        res.status(200).json({ data: cake });
    });
};

// Handle update cake info. Takes the ID & new data sent in the request, and updates the database record
exports.update = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {

            Cake.findById(req.params.cake_id, function (err, cake) {
                if (err) {
                    return res.status(500).send({ data: err });
                }

                cake.name = req.body.name ? req.body.name : cake.name;
                cake.price = req.body.price ? req.body.price : cake.price;
                cake.image = req.body.image ? req.body.image : cake.image;
                cake.description = req.body.description ? req.body.description : cake.description;
                cake.priority = req.body.priority ? req.body.priority : cake.priority;
                cake.visible = req.body.visible;
                cake.update_date = Date.now();

                // Save the cake updated data
                cake.save(function (err) {
                    if (err) {
                        return res.status(500).json({ data: err });
                    }

                    // Delete existing cache data, so changes will have immediate effect on next request.
                    cakesCache.del([ 'allCakes', 'visibleCakes' ]);

                    // Log the change, and return a 'success' response to the user
                    logger.info(request.user + " updated the " + cake.name + " product data");
                    return res.status(200).json({ data: cake });
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

// Handle delete cake. Takes the record ID, iterates all other database records, before removing record.
exports.delete = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {
            const recordID = req.params.cake_id;

            // Find the record to be deleted, and increment the priority rating of all following records by 1
            getAllCakes(function (err, cakes) {
                if (err) {
                    return res.status(500).json({data: err});
                }

                // Find the product position in the database
                const listPosition = cakes.indexOf(cakes.find( element => element.id === recordID ));

                // for all database records after the deleted item, increment their priority rating by 1
                for (let i = listPosition + 1; i < cakes.length; i++) {
                    Cake.findById(cakes[i].id, function (err, cake) {
                        if (!err) {
                            cake.priority = cakes[i].priority - 1;
                            cake.save();
                        }
                    });
                }
            });

            // Delete the record from the database
            Cake.deleteOne({_id: recordID}, function (err, cake) {
                if (err) {
                    return res.status(500).json({ data: err });
                }

                // Delete existing cache data, so changes will have immediate effect on next request.
                cakesCache.del([ 'allCakes', 'visibleCakes' ]);

                // Log the change, and return a 'success' response to the user
                logger.info(request.user + ' deleted the following cake : { id: ' + recordID + ' } ');
                return res.status(200).json({ data: cake });
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
