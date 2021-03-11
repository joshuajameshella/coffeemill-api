const jwt = require('jsonwebtoken');
const logger = require('../logger/logger');

Users = require('./model');

// Handle user login by checking whether the username & password combo exists in the 'users' database collection
exports.login = function (req, res) {

    // Data sent with login request
    const username = req.body.username;
    const password = req.body.password;

    // Get a list of all known users from the database
    Users.get(function (err, knownUsers) {
        if (err) {
            return res.status(500).json({
                message: 'Unable to retrieve user data from the database',
                token: ''
            });
        }

        // Find the user data that matches the request username & password
        const user = knownUsers.find(u => u.username === username && u.password === password);

        // If the login credentials match the data records, generate & return a JSON Web Token for the user
        if (user) {
            logger.info(user.name + " logged in!");

            // Generate the JWT for the user's future Admin requests
            const token = jwt.sign({ roles: 'ADMIN', name: user.name }, process.env.JWT);
            return res.status(200).json({
                message: 'Success',
                token: token
            });
        } else {
            return res.status(200).json({
                message: 'Incorrect login data',
                token: ''
            });
        }
    });
};

// getRoles takes the JWT token, and extracts the user data using the SecretKey
exports.getRoles = function (token) {
     return jwt.verify(token, process.env.JWT, function(err, decoded) {
         if (err) {
             return err;
         }
         return { roles: decoded.roles, user: decoded.name };
    });
}