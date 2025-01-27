// Import Mongoose
const mongoose = require("mongoose");

// Define the User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\S+@\S+\.\S+$/,
  },
  
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  status: {
    type: String,
    required:true
  },
  last_login:{
    type: String,
    // required:true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the User model
const User = mongoose.model("User", userSchema);

// Export the model
module.exports = User;