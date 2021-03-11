const logger = require('../logger/logger');
const userController = require('../user/controller');
const NodeCache = require( "node-cache" );

// Create a new cache for 'treat' data, with a 30 minute memory
const treatsCache = new NodeCache();
const cacheTimeout = 1800;

// Import 'treats' model
Treat = require('./model');

// getAllTreats returns a list of every treat in the database. Should only be used by Admin users.
function getAllTreats(callback) {

    // Check whether the ADMIN data exists in cache memory, to prevent unnecessary database queries
    let treats = treatsCache.get( "allTreats" );
    if ( treats === undefined ) {

        // If data does not exist in cache, attempt to query the database, and store the results in cache memory
        Treat.getAll(function (err, treats) {
            if (!err) {
                // If no error occurred, save the treats data in cache memory
                treatsCache.set( "allTreats", treats, cacheTimeout );
            }
            return callback(err, treats);
        });
    } else {
        return callback(null, treats);
    }
}

// getVisibleTreats returns a list of all 'visible' treats in the database. Can be used by all users.
function getVisibleTreats(callback) {

    // Check whether the ADMIN data exists in cache memory, to prevent unnecessary database queries
    let treats = treatsCache.get( "visibleTreats" );
    if ( treats === undefined ) {

        // If data does not exist in cache, attempt to query the database, and store the results in cache memory
        Treat.getVisible(function (err, treats) {
            if (!err) {
                // If no error occurred, save the treats data in cache memory
                treatsCache.set( "visibleTreats", treats, cacheTimeout );
            }
            return callback(err, treats);
        });
    } else {
        return callback(null, treats);
    }
}

// Handle index actions. Retrieves all 'treats' in the database
exports.index = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {
            getAllTreats(function (err, treats) {
                if (err) {
                    return res.status(500).json({ data: err });
                }
                return res.status(200).json({ data: treats });
            });
        } else {
            // If no roles are present in the JWT, return an 'Unauthorized' API response
            return res.status(403).json({ data: 'Unauthorized user action' });
        }
    } else {
        // If no Authorization header is sent with the request, return only 'visible' products
        // Check whether the 'visible' data exists in cache memory, to prevent unnecessary database queries
        let visibleTreats = treatsCache.get( "visibleTreats" );
        if ( visibleTreats === undefined ) {
            getVisibleTreats(function (err, treats) {
                if (err) {
                    return res.status(500).json({ data: err });
                }
                return res.status(200).json({ data: treats });
            });
        } else {
            // Return all 'visible' treat data to regular user
            return res.status(200).json({ data: visibleTreats });
        }
    }
};

// Handle create treat actions. Takes the treat data & adds a new record to the database
exports.new = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {
            getAllTreats(function (err, treats) {
                if (err) {
                    return res.status(500).json({ data: err });
                }

                // Calculate the product order based on existing products
                let productPriority = 1;
                if (treats.length > 0) {
                    productPriority = treats[treats.length - 1].priority + 1
                }

                const treat = new Treat();
                treat.name = req.body.name ? req.body.name : "";
                treat.price = req.body.price ? req.body.price : "0.00";
                treat.image = req.body.image ? req.body.image : "";
                treat.description = req.body.description ? req.body.description : "";
                treat.priority = productPriority;
                treat.visible = req.body.visible ? req.body.visible : false;

                // save the treat and check for errors
                treat.save(function (err) {
                    if (err) {
                        return res.status(500).json({ data: err });
                    }

                    // Delete existing cache data, so changes will have immediate effect on next request.
                    treatsCache.del([ 'allTreats', 'visibleTreats' ]);

                    // Log the change, and return a 'success' response to the user
                    logger.info(request.user + " added the following treat : " + treat.name + ' { id: ' + treat._id + " } ");
                    return res.status(201).json({ data: treat });
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

// Handle view treat info. Takes the ID sent in the request, and returns the matching database record
exports.view = function (req, res) {
    Treat.findById(req.params.treat_id, function (err, treat) {
        if (err)
            return res.status(500).send({ data: err });
        res.status(200).json({ data: treat });
    });
};

// Handle update treat info. Takes the ID & new data sent in the request, and updates the database record
exports.update = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {

            Treat.findById(req.params.treat_id, function (err, treat) {
                if (err) {
                    return res.status(500).send({ data: err });
                }

                treat.name = req.body.name ? req.body.name : treat.name;
                treat.price = req.body.price ? req.body.price : treat.price;
                treat.image = req.body.image ? req.body.image : treat.image;
                treat.description = req.body.description ? req.body.description : treat.description;
                treat.priority = req.body.priority ? req.body.priority : treat.priority;
                treat.visible = req.body.visible;
                treat.update_date = Date.now();

                // Save the treat updated data
                treat.save(function (err) {
                    if (err) {
                        return res.status(500).json({ data: err });
                    }

                    // Delete existing cache data, so changes will have immediate effect on next request.
                    treatsCache.del([ 'allTreats', 'visibleTreats' ]);

                    // Log the change, and return a 'success' response to the user
                    logger.info(request.user + " updated the " + treat.name + " product data");
                    return res.status(200).json({ data: treat });
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

// Handle delete treat. Takes the record ID, iterates all other database records, before removing record.
exports.delete = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {
            const recordID = req.params.treat_id;

            // Find the record to be deleted, and increment the priority rating of all following records by 1
            getAllTreats(function (err, treats) {
                if (err) {
                    return res.status(500).json({data: err});
                }

                // Find the product position in the database
                const listPosition = treats.indexOf(treats.find( element => element.id === recordID ));

                // for all database records after the deleted item, increment their priority rating by 1
                for (let i = listPosition + 1; i < treats.length; i++) {
                    Treat.findById(treats[i].id, function (err, treat) {
                        if (!err) {
                            treat.priority = treats[i].priority - 1;
                            treat.save();
                        }
                    });
                }
            });

            // Delete the record from the database
            Treat.deleteOne({_id: recordID}, function (err, treat) {
                if (err) {
                    return res.status(500).json({ data: err });
                }

                // Delete existing cache data, so changes will have immediate effect on next request.
                treatsCache.del([ 'allTreats', 'visibleTreats' ]);

                // Log the change, and return a 'success' response to the user
                logger.info(request.user + ' deleted the following treat : { id: ' + recordID + ' } ');
                return res.status(200).json({ data: treat });
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
