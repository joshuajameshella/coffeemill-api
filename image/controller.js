const AWS = require('aws-sdk');
const userController = require('../user/controller');

// Create the credentials needed for accessing AWS S3 bucket.
function createCredentials() {
    AWS.config.update(
        {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    );
    return new AWS.S3();
}

// Handle upload image actions
exports.new = function (req, res) {

    // Check that an 'Authorization' header has been sent with the API request
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Decode the JWT token, and make sure that the user has 'Admin' privileges
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {

            const buf = Buffer.from(req.body.image.replace(/^data:image\/\w+;base64,/, ""),'base64')

            const s3 = createCredentials();

            // Setting up S3 upload parameters
            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: req.body.name + ".jpg",
                Body: buf,
                ACL: 'public-read',
                ContentEncoding: 'base64',
                ContentType: 'image/jpg'
            };

            // Uploading files to the bucket
            s3.upload(params, function(err, data) {
                if (err) {
                    return res.status(500).json({
                        message: 'Unable to upload image to S3 bucket',
                        data: err
                    });
                }
                res.status(200).json({
                    message: 'Image successfully uploaded',
                    data: data
                });
            });

        } else {
            return res.status(403).json({
                message: 'User does not have required roles to perform this action',
            });
        }
    }  else {
        return res.status(401).json({
            message: 'Authorization header missing from request',
        });
    }
};

// Handle delete image
exports.delete = function (req, res) {

    // Check that an 'Authorization' header has been sent with the API request
    const authHeader = req.header("Authorization");
    if (authHeader) {

        // Decode the JWT token, and make sure that the user has 'Admin' privileges
        const request = userController.getRoles(authHeader.split(' ')[1]);
        if (request.roles === 'ADMIN') {

            const s3 = createCredentials();

            // Setting up S3 upload parameters
            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: req.body.id + ".jpg",
            };

            s3.deleteObject(params, function(err, data) {
                if (err) {
                    return res.status(500).json({
                        message: 'Unable to delete image from S3 bucket',
                        data: err
                    });
                }
                res.status(200).json({
                    message: 'Image successfully deleted',
                    data: data
                });
            });

        } else {
            return res.status(403).json({
                message: 'User does not have required roles to perform this action',
            });
        }
    }  else {
        return res.status(401).json({
            message: 'Authorization header missing from request',
        });
    }
};
