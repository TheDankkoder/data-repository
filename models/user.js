const mongoose = require('mongoose');
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { ObjectId } = require('mongodb');

const userSchema = new mongoose.Schema({

    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    files : []
  });
  
  
  const User = mongoose.model("User", userSchema);
  
  module.exports = User ;
  
  