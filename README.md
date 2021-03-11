# Coffee Mill and Cakes : Backend API

This is the back-end API service for The Coffee Mill & Cakes [website]("http://www.thecoffeemillandcakes.co.uk").

The website & API service come together to form a full stack MERN application, with the API making use of a MongoDB database, accessible via an Express.js server framework running inside a node.js application.

Managing product data is the main purpose of this service, and therefore using AWS S3 to upload and store larger files ( such as images ) was an ideal solution.

---

## Endpoints

The website data is stored across multiple different MongoDB collections, accessible via standard CRUD operations.

In order to prevent unnecessary database operations, product data returned from requests is saved to cached memory for a period of 60 minutes.

Users are allowed to make `READ` requests, in order to view all product data when visiting the website. However, modifying product data requires specific Admin roles ( *discussed below* ).

## Security

As mentioned above, all users are able to make `GET` requests to the product endpoints. However, regular users should not be allowed to access operations such as `Create`, `Update`, `Delete`, and so these endpoints are protected, and only accessible by users with Admin privileges. 

To achieve this, the database has a `Users` collection, where user login credentials are encrypted and stored.

Upon a successful user login attempt, the API uses an encryption key to generate and return a JWT to the user. This JWT is then saved to the browser's localStorage, and sent back to the API for subsequent 'Admin-only' requests, where it is decoded, and used to determine whether the user has the necessary roles.

## Hosting

The application is hosted on an EC2 instance.