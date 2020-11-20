var express = require("express");
var router = express.Router(); // using the express Router method
var mongojs = require("mongojs"); // this is the ORM (Object Relational Mapping) used
var db = mongojs("passportapp", ["users"]); //creating database instance that we can use; passport is the handler while users is a collection
var bcrypt = require("bcryptjs"); // for encrypting the passport
var passport = require("passport"); //takes care of authentication...
var LocalStrategy = require("passport-local").Strategy; //in this case ,multiple strategy can be used like  twitter or facebook or email,  but in this case I just kept it local

//log in page :  A GET request
router.get("/login", function (req, res) {
  res.render("login");
});
// register page: A GET request
router.get("/register", function (req, res) {
  res.render("register");
});

//POST request for our register form
router.post("/register", function (req, res) {
  console.log("Adding User...");

  //Getting and storing the form values
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password;

  // validation of the entry fields using express validator
  req.checkBody("name", "Name is required").notEmpty();
  req.checkBody("email", "Email field is required").notEmpty();
  req.checkBody("email", "Please use a valid email address").isEmail();
  req.checkBody("username", "Username is required").notEmpty();
  req.checkBody("password", "Password field is required").notEmpty();
  req
    .checkBody("password2", "Passwords do not match")
    .equals(req.body.password);

  //check for errors
  var errors = req.validationErrors();
  if (errors) {
    console.log("form has errors!");
    res.render("register", {
      errors: errors,
      name: name,
      email: email,
      username: username,
      password: password,
      password2: password2,
    });
  } else {
    //to handle the actual submission if it goes through. First we build an object from these variables that are coming from the form:
    var newUser = {
      name: name,
      email: email,
      username: username,
      password: password,
    };
    // encrypting our password
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(newUser.password, salt, function (err, hash) {
        newUser.password = hash;
        // insert the above object using mongojs
        db.users.insert(newUser, function (err, doc) {
          if (err) {
            res.send(err);
          } else {
            console.log("User added");
            //send a success message using flash
            req.flash("success", "You are registered and can now log in");

            //redirect after register
            res.location("/");
            res.redirect("/");
          }
        });
      });
    });
  }
});
// this is used to access the messages from the user
passport.serializeUser(function (user, done) {
  done(null, user._id); // mongodb uses an underscore id field
});

passport.deserializeUser(function (id, done) {
  db.users.findOne({ _id: mongojs.ObjectId(id) }, function (
    err,
    user //  .findById was removed because it is not part of mongojs but part of mongoose. Also mongodb stores object ids
  ) {
    done(err, user);
  });
});
// create the local strategy
passport.use(
  new LocalStrategy(function (username, password, done) {
    //now reaching into a database a grab a user by their user name using the code below
    db.users.findOne(
      {
        username: username  
      },
      function (err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: "Incorrect Username" });
        }

        bcrypt.compare(password, user.password, function (err, isMatch) {
          if (err) {
            return done(err);
          }
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Incorrect Password" });
          }
        });
      }
    );
  })
);

// to include a passport.post in the login route which is a middleware in functionality LOG -IN ROUTE
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/users/login",
    failureFlash: "Invalid Username or Password",
  }),
  function (req, res) {
    console.log("Auth  Successful");
    res.redirect("/");
  }
);

router.get("/logout", function (req, res) {
  req.logout();
  res.flash("success", "You have logged out");
  res.redirect("/users/login");
});

module.exports = router;
