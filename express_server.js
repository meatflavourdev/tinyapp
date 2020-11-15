const express = require("express");
const { addURL, createUser, editURL, findUser, getURL, getUser, removeURL, setCookie, validPassword } = require("./helpers.js");
const { PORT, COOKIE_EXPIRE_MINS } = require("./constants");

// Initialize Express
const app = express();

// Middleware
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: [
      "8bqv3m7fvxheu1QLJx5JvvXSv",
      "384V5D5I8nFEwRmiQ55nBiGmz",
      "aFav38T7nM6Du04JI7474Os38",
      "F4biAwxJWy5Kcih92dCw65B97",
      "0nRig2RdReeXU2YWaT32l1rdg",
      "6qiRgLT4H9RtdVX2CEe8omTGR",
      "1gLhSonS8MYCSx42o1jFzKO2M",
      "DiWASDT35OfyIg7M4eXscG5KU",
      "2u149610yVRY4fJB27m615ZMu",
      "13Qv5i2S9fN3lw75SNKG6ImL1",
    ],
    maxAge: COOKIE_EXPIRE_MINS * 60 * 1000,
  })
);

// Set view engine
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": { shortID: "b2xVn2", longURL: "http://www.lighthouselabs.ca", userID: "GDSd45_Dbb", public: true },
  "sdf1a2": { shortID: "sdf1a2", longURL: "https://developer.okta.com/", userID: "GDSd45_Dbb", public: true },
  "9sm5xK": { shortID: "9sm5xK", longURL: "http://www.google.ca", userID: "Hsd62s3VV-", public: false },
  "AS-vV_": { shortID: "AS-vV_", longURL: "https://expressjs.com/en/resources/middleware/", userID: "Hsd62s3VV-", public: false },
  "2mtVwR": { shortID: "2mtVwR", longURL: "https://dev.to/heithemmoumni/build-a-blog-with-svelte-strapi-and-apollo-2ad5", userID: "GDSd45_Dbb", public: false },
  "WWeTF7": { shortID: "WWeTF7", longURL: "https://medium.com/@mroth/how-i-built-emojitracker-179cfd8238ac", userID: "Hsd62s3VV-", public: true },
  "44HRst": { shortID: "44HRst", longURL: "https://fs.blog/mental-models/#learning_to_think_better", userID: "GDSd45_Dbb", public: false },
  "QwtQ9e": { shortID: "QwtQ9e", longURL: "https://dev.to/karinesabatier/getting-started-with-svelte-3289", userID: "Hsd62s3VV-", public: true },
  "ZIJ2Tu": { shortID: "ZIJ2Tu", longURL: "https://uibakery.io/", userID: "GDSd45_Dbb", public: false },
  "CRi8hs": { shortID: "CRi8hs", longURL: "https://www.inverse.com/", userID: "Hsd62s3VV-", public: true },
};

const users = {
  // eslint-disable-next-line camelcase
  "GDSd45_Dbb": { id: "GDSd45_Dbb", email: "zenimus@gmail.com", password: "$2b$10$ByI86Q9Rd9pxasa.Fhl5muIG1dt.RlChQf971zmO4pf10IuIvPE1e" },
  "Hsd62s3VV-": { id: "Hsd62s3VV-", email: "user2@example.com", password: "$2b$10$8guuOuUXAlfPFa8taeeY..tBFyYKhlsPYewoTFyIgbofrzvXRDiee" },
};

// --------------------------------
// MIDDLEWARE
// --------------------------------
app.use(function(req, res, next) {
  res.locals.user = getUser(req.session.user, users) || {}; // Empty user object if no user
  next();
});

const getURLindex = function(req, res, next) {
  res.locals.urls = Object.values(urlDatabase).filter((value) => {
    if (value.public && value.userID !== res.locals.user.id) return true;
  });
  res.locals.user.urls = Object.values(urlDatabase).filter((value) => {
    if (value.userID === res.locals.user.id) return true;
  });
  return next();
};

const checkAuth = function(req, res, next) {
  if (req.session.user in users) {
    return next();
  }
  return res.redirect('/login?status=notAuthorized');
};

// --------------------------------
// Index
// --------------------------------
app.get("/", (req, res) => {
  return res.redirect(302, "/urls");
});

app.get("/urls.json", getURLindex, (req, res) => {
  if (req.session.user) {
    return res.json(res.locals.user.urls);
  }
  return res.json(res.locals.urls);
});

app.get("/urls", getURLindex,  (req, res) => {
  return res.render("urls_index");
});

// --------------------------------
// Authentication
// --------------------------------

app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect('/urls');
  }
  if (req.query.status === "notAuthorized") {
    res.locals.notAuthorized = true;
  }
  return res.render("auth_login");
});

app.get("/register", (req, res) => {
  if (req.session.user) {
    return res.redirect('/urls');
  }
  return res.render("auth_register");
});

app.post("/register", (req, res) => {
  const { email, password, passwordConfirm } = req.body; // Get data from registration form
  createUser({ email, password, passwordConfirm }, users, (err, user) => {
    if (err) {
      res.locals.err = err;
      res.status(400);
      return res.render("auth_register");
    }
    setCookie(req, user.id); // Log the user in with a cookie
    return res.redirect('/urls?status=welcome'); // Set status query variable to trigger welcome message
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  // Check that user exists and password is correct
  const user = findUser(email, users);
  if (!user || !validPassword(password, user)) {
    return res.status(403).render("auth_login", { error: true });
  }
  setCookie(req, user.id);
  return res.redirect(`/urls`);
});
app.get("/logout", (req, res) => {
  req.session = null;
  return res.redirect(`/urls`);
});

// --------------------------------
// Record Mutation
// --------------------------------

// POST New short URL creation form handler
app.post("/urls", checkAuth, (req, res) => {
  const public = req.body.public ? true : false;
  const url = addURL(urlDatabase, req.body.longURL, req.session.user, public);
  return res.redirect(`/urls/${url.shortID}`);
});

// New URL creation form
app.get("/urls/new", checkAuth, (req, res) => {
  const templateVars = { urls: urlDatabase };
  return res.render("urls_new", templateVars);
});

// DELETE Remove short URL button handler
app.post("/urls/:shortID/delete", checkAuth, (req, res) => {
  const url = getURL(urlDatabase, req.params.shortID);
  // Error if shortID not valid
  if (!url) {
    return res.status(404).render("error_NotFound", { shortID: req.params.shortID });
  }
  // Check Ownership
  if (req.session.user !== url.userID) {
    return res.status(401).render("error_NotAuthorized", url);
  }
  // Delete the URL and redirect to index
  const removedURL = removeURL(urlDatabase, req.params.shortID, req.session.user);
  if (!removedURL) {
    return res.status(500).render("error_500"); // Something went wrong
  }
  return res.redirect(302, "/urls");
});

// UPDATE Edit short URL form handler
app.post("/urls/:shortID", checkAuth, (req, res) => {
  const url = getURL(urlDatabase, req.params.shortID);
  // Error if shortID not valid
  if (!url) {
    return res.status(404).render("error_NotFound", { shortID: req.params.shortID });
  }
  // Check Ownership
  if (req.session.user !== url.userID) {
    return res.status(401).render("error_NotAuthorized", url);
  }
  // Save edit to the URLdatabase object
  const longURL = req.body.longURL;
  const public = req.body.public ? true : false;
  const modifiedURL = editURL(urlDatabase, url.shortID, req.session.user, longURL, public);
  if (!modifiedURL) {
    return res.status(500).render("error_500"); // Something went wrong
  }
  return res.redirect(302, "/urls");
});

// --------------------------------
// Short URLs
// --------------------------------

app.get("/urls/:shortID", checkAuth, (req, res) => {
  const url = getURL(urlDatabase, req.params.shortID);
  // Error if shortID not valid
  if (!url) {
    return res.status(404).render("error_NotFound", { shortID: req.params.shortID });
  }
  // Check Ownership
  if (req.session.user !== url.userID) {
    return res.status(401).render("error_NotAuthorized", url);
  }
  // Render shortID page
  return res.render("urls_show", url);
});

// Handle shortIDs-- redirect to long URL
app.get("/u/:shortID", (req, res) => {
  const url = getURL(urlDatabase, req.params.shortID);
  // Error if shortID not valid
  if (!url) {
    return res.status(404).render("error_NotFound", { shortID: req.params.shortID });
  }
  // Redirect to long URL
  return res.redirect(302, url.longURL);
});

// --------------------------------
// Errors
// --------------------------------

// error handler
app.use(function(err, req, res, next) {
  const { status, message, stack } = err;
  console.log(status, message, stack);
  // render the error page
  res.status(status || 500);
  return res.render("error", { status, message, stack });
});

// --------------------------------
// Server Start
// --------------------------------

// Server start message
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
