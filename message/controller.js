const logger = require('../logger/logger');
const userController = require('../user/controller');
const nodemailer = require("nodemailer");

Message = require('./model');

// getAllMessages returns a list of every message in the database. Should only be used by Admin users.
function getAllMessages(callback) {
    Message.getAll(function (err, messages) {
        return callback(err, messages);
    });
}

// sendMessage sends an email to the admin user, letting them know that a new message has been submitted
async function sendMessage(message) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_FROM,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const html =
        `<h2><b>You have a new message!</b></h2>` +
        `<p><b>From: </b> ${message.name ? message.name : 'Unknown'}</p>` +
        `<p><b>Their Contact info: </b> ${message.contactInfo}</p>` +
        `<p><b>Their Message: </b> ${message.message}</p></br></br>` +
        `<p><i>Alternatively, to view and manage all your messages, go to your <a href="http://www.coffeemillandcakes.co.uk/messages">admin page</a></i></p>`
    ;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        subject: 'New Message!',
        html: html
    };

    return transporter.sendMail(mailOptions);
}

// Handle index actions. Retrieves all 'messages' in the database
exports.index = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {
            getAllMessages(function (err, treats) {
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
        // If no roles are present in the JWT, return an 'Unauthorized' API response
        return res.status(401).json({ data: 'Request missing Authorization header' });
    }
};

// Handle create message actions. Takes the message data & adds a new record to the database
exports.new = function (req, res) {

    const message = new Message();
    message.name = req.body.name;
    message.contactInfo = req.body.contactInfo;
    message.message = req.body.message;
    message.viewed = false;
    message.timestamp = Date.now();

    // save the message and check for errors
    message.save(function (err) {
        if (err) {
            return res.status(500).json({ data: err });
        }

        // Log the change, and return a 'success' response to the user
        sendMessage(message).then(() => {
            logger.info("A new message has been submitted!");
        });
        return res.status(201).json({ data: message });
    });

};

// Handle view message info. Takes the ID sent in the request, and returns the matching database record
exports.view = function (req, res) {
    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {

            Message.findById(req.params.message_id, function (err, message) {
                if (err) {
                    return res.status(500).send({ data: err });
                }

                message.viewed = true;
                message.save(function (err) {
                    if (err) {
                        return res.status(500).json({data: err});
                    }
                });

                return res.status(200).json({ data: message });
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

// Handle delete message. Takes the record ID, iterates all other database records, before removing record.
exports.delete = function (req, res) {

    // Check for Authorization header containing JWT
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Separate the token from header => 'Bearer eyJyHg/...'
        // If the header contains the 'ADMIN' role, allow all admin commands.
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {
            const recordID = req.params.message_id;

            // Delete the record from the database
            Message.deleteOne({_id: recordID}, function (err, message) {
                if (err) {
                    return res.status(500).json({ data: err });
                }

                // Log the change, and return a 'success' response to the user
                logger.info(request.user + ' deleted the following message : { id: ' + recordID + ' } ');
                return res.status(200).json({ data: message });
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
