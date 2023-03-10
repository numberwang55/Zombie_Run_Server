const express = require("express");

const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const {
  findCustomers,
  addCustomers,
  findUsers,
  addUser,
} = require("./controllers/userController");
const {
  getRunsByUser,
  postRun,
  updateRun,
  deleteRun,
} = require("./controllers/runController");
const passport = require("passport");
const bodyParser = require("body-parser");

const UserModel = require("./models/user");

dotenv.config({ path: "./config/config.env" });

if (process.env.NODE_ENV !== "test") {
  connectDB();
}

require("./auth/auth");

const authRoute = require("./routes/authRoute");
const userRoutes = require("./routes/userRoutes");
const runsRoutes = require("./routes/runsRoutes");
const apiRoute = require("./routes/apiRoute");
const {
  duplicateKeyMongooseError,
  userValidationFailedError,
  defaultErrorHandler,
  undefinedUserId,
} = require("./controllers/errorController");

const app = express();
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: false }));

app.use("/", apiRoute);
app.use("/", authRoute);

// Plug in the JWT strategy as a middleware so only verified users can access this route.
app.use("/user", passport.authenticate("jwt", { session: false }), userRoutes);

app.use("/runs", passport.authenticate("jwt", { session: false }), runsRoutes);

// Handle errors.
defaultErrorHandler(app);
app.use(duplicateKeyMongooseError);
app.use(userValidationFailedError);
app.use(undefinedUserId);
app.use(function (err, req, res, next) {
  console.log(err);
  res.status(err.status || 500);
  res.json({ error: err });
});

module.exports = app;
