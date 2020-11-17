const { renderFile } = require("ejs");
var express = require("express");
var router = express.Router(); // using the express Router method

// index page
router.get("/", ensureAuthenticated, function (req, res) {
  res.render("index");
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

module.exports = router;
