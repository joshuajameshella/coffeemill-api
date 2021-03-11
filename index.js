let express = require('express');
let bodyParser = require('body-parser');
let mongoose = require('mongoose');
let logger = require('./logger/logger');
let dotenv = require('dotenv');
let cors = require('cors');
let app = express();

// Declare the address that MongoDB is running on
let mongoDBAddress = "mongodb://127.0.0.1:27017/coffeemill-api";

// Import API routes
let apiRoutes = require("./api-routes");

// Configure bodyparser to handle post requests
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Connect to Mongoose and set connection variable
mongoose.connect(mongoDBAddress, {useNewUrlParser: true, useUnifiedTopology: true});

// Added check for DB connection
if(!mongoose.connection)
    logger.error("Error connecting to MongoDB");
else
    logger.info("MongoDB connected successfully");

// Setup server port
const port = process.env.PORT || 8080;

// Use API routes & Headers in the App
app.use('/', cors(), apiRoutes);

// Launch app to listen to specified port
app.listen(port, function () {
    logger.info("Running API on port " + port);
});
