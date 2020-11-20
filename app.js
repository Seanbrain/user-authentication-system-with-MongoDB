var express = require("express");
var path = require("path");
var expressValidator = require("express-validator");
var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var bodyParser = require("body-parser");
var flash = require("connect-flash"); // express messages allows us to basically display things like..you are logged in or logged out

var routes = require("./routes/index"); //breaking route in two different session ..index(homepage) and
var users = require("./routes/users"); //  users(log in and logout)

var app = express(); //create app variable

app.set("views", path.join(__dirname, "views")); //setting view folder to views
app.set("view engine", "ejs"); // set up view engine

app.use(express.static(path.join(__dirname, "public"))); //set static folder and call it public
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css")); // set a static path for bootstrap css file

app.use(bodyParser.json()); //set up body parser middleware
app.use(bodyParser.urlencoded({ extended: false })); //set up body parser middleware

app.use(session({ secret: "secret", saveUninitialized: true, resave: true })); //express session middleware

app.use(passport.initialize()); //middleware for passport
app.use(passport.session()); //middleware for passport

// middleware for express validator
app.use(
  expressValidator({
    errorFormatter: function (param, msg, value) {
      var namespace = param.split("."),
        root = namespace.shift(),
        formParam = root;
      while (namespace.length) {
        formParam += "[" + namespace.shift() + "]";
      }
      return {
        param: formParam,
        msg: msg,
        value: value,
      };
    },
  })
);

// middleware for Connect-Flash. Note that connect-flash works with express messages

app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = require("express-messages")(req, res);
  next();
});

//creating a global variable(user) to access the user information by creating a route to everything. that means it is going to load on every route
app.get("*", function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});

//Define routes to index and users
app.use("/", routes);
app.use("/users", users);

// Now listen to server on port
app.listen(3000);
console.log("SERVER STARTED ON PORT 3000");
