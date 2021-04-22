const express = require('express');
const path = require('path');
const fs = require('fs');
const mongodb = require('mongodb');
const ObjectID = mongodb.ObjectID;
require('dotenv').config();

const app = express();

app.use(express.json());

const MongoClient = mongodb.MongoClient;
let db;
const dbConnection = async () => {
  await MongoClient.connect(
    process.env.DB_URI,
    { useUnifiedTopology: true },
    (err, client) => {
      db = client.db('psa');
      console.log('db connected');
    }
  );
};
dbConnection();

// Middleware to log requests
app.use(function requestHandler(request, response, next) {
  console.log('In comes a ' + request.method + ' to: ' + request.url);
  next();
});

// Middleware for static files
app.use(function (req, res, next) {
  var filePath = path.join(__dirname, 'static', req.url);

  fs.stat(filePath, function (err, fileInfo) {
    if (err) {
      next();
      return;
    }
    if (fileInfo.isFile()) {
      return res.sendFile(filePath);
    }
    next();
  });
});

// Get the collection Name
app.param('collectionName', (req, res, next, collectionName) => {
  req.collection = db.collection(collectionName);
  return next();
});

// Display Message for the root path to show the API is working
app.get('/', (req, res) => {
  res.send(
    'Api is working, Please select a collection, eg collection/messages'
  );
});

//Retrieve all the objects from a collection within MongoDB
app.get('/collection/:collectionName', (req, res) => {
  console.log('lesson');
  req.collection.find({}).toArray((e, results) => {
    if (e) return next(e);
    res.json({ status: 'success', results });
  });
});

//Add an object to Mongodb
app.post('/collection/:collectionName', (req, res, next) => {
  req.collection.insert(req.body, (e, results) => {
    if (e) return next(e);
    res.json({ status: 'success', results: results.ops });
  });
});

// Update an object by ID
app.put('/collection/:collectionName/:id', (req, res, next) => {
  req.collection.update(
    { _id: new ObjectID(req.params.id) },
    { $set: req.body },
    { safe: true, multi: false },
    (e, result) => {
      if (e) return next(e);
      if (result.result.n === 1) {
        return res.json({ status: 'success', message: 'Update successful' });
      } else {
        return res.json({ status: 'error', message: 'Error updating!' });
      }
    }
  );
});

// Delete An object By ID
app.delete('/collection/:collectionName/:id', (req, res, next) => {
  req.collection.deleteOne({ _id: ObjectID(req.params.id) }, (e, result) => {
    if (e) return next(e);
    if (result.result.n === 1) {
        return res.json({ status: 'success', message: 'Delete successful' });
      } else {
        return res.json({ status: 'error', message: 'Error deleting!' });
      }
  });
});

app.listen(2000);
console.log('server running on Port 2000');