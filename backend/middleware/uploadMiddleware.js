const express = require('express');
const path = require('path');

const app = express();

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = app;
