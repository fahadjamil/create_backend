// server.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const PORT = process.env.SERVERPORT || 8080;

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
require("./routes/index")(app);

// Example API route
app.get("/api/data", (req, res) => {
  res.json({ message: "Hello from simple Node project!" });
});

// Start server
module.exports = app;
