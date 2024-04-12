const express = require("express");
const {
  User,
  Product,
  userAdder,
  productAdder,
  mongoose,
  Order,
} = require("./mongocon");
const cors = require("cors");
const app = express();
app.use(cors());
const port = 8000;
const ObjectId = mongoose.Types.ObjectId;
app.use(express.json());

module.exports = {
  express,
  User,
  Product,
  mongoose,
  app,
  port,
  ObjectId,
  Order,
};
