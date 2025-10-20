const express = require('express');
const connectDB = require('./db');

const app = express();
connectDB();