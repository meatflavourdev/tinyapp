const express = require("express");
const bcrypt = require('bcrypt');
const validator = require("validator");
const { charsetbase64, generateRandomString } = require("./shortIDs");
const PORT = 3000; // default port 8080
const COOKIE_EXPIRE_MINS = 10;
const USER_ID_LENGTH = 9;
const SHORTURL_LENGTH = 6;

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
// HELPER FUNCTIONS
// --------------------------------

const addURL = function(longURL, userID, public = false) {
  const shortID = generateRandomString(SHORTURL_LENGTH, charsetbase64);
  console.log(`CREATE shortID ${shortID} longURL: ${longURL} userID: ${userID} public: ${public}`);
  urlDatabase[shortID] = { shortID, longURL, userID, public };
  return urlDatabase[shortID];
};

/**
 * Output to console if in development environment
 * @param  {...any} ...args Variables or strings to output to console
 */
const devlog = function(...args) {
  if (app.get("env") === "development") {
    return console.log(...args);
  }
  return;
};

/**
 * Get user object from users stotage object by the user ID
 * @param  {String} userID Primary key identifying user
 * @param {Object} userDataObject An object containing key value pair of userIDs to user objects
 * @return {Object} User object { id, email } or null
 */
const getUser = function(userID, userDataObject) {
  if (userID in userDataObject) {
    const { id, email } = userDataObject[userID];
    return { id, email };
  }
  return null;
};

/**
 * Get user object from users stotage object by the email
 * @param  {String} email The user email address
 * @param {Object} userDataObject An object containing key value pair of userIDs to user objects
 * @return {Object} User object { id, email } or null
 */
const findUser = function(email, userDataObject) {
  const user = Object.entries(userDataObject).find((value) => {
    if (value[1].email === email) return true;
  });
  if (!user || user.length === 0) return false;
  return user[1];
};

/**
 * Check if password input exsits and is valid given a user object
 * @param  {String} password password to validate
 * @param  {Object} user user to compare against
 */
const validPassword = function(password, user) {
  console.log(`password: ${password} user: ${user.password}`);
  const valid = bcrypt.compareSync(password, user.password);
  if (!password || !valid) { return false; }
  return true;
};

const checkAuth = function(req, res, next) {
  if (req.session.user in users) {
    return next();
  }
  return res.redirect('/login');
};

// TODO Correctly Display Error Message on Client
// TODO Refactor validation and error object
// TODO Refactor error handling with middleware validators
const createUser = function(userInput, userDataObject, cb) {
  const { email, password, passwordConfirm } = userInput;
  // eslint-disable-next-line camelcase
  if (validator.isEmpty(email, { ignore_whitespace: true }))
    return cb({ email: { valid: false, message: "Please enter an email address" } });
  if (!validator.isEmail(email)) return cb({ email: { valid: false, message: "Please enter a valid email address" } });
  // eslint-disable-next-line camelcase
  if (validator.isEmpty(password, { ignore_whitespace: true }))
    return cb({ password: { valid: false, message: "Please enter a password" } });
  // eslint-disable-next-line camelcase
  if (validator.isEmpty(passwordConfirm, { ignore_whitespace: true }))
    return cb({ passwordConfirm: { valid: false, message: "Please enter a password confirmation" } });
  if (!validator.equals(password, passwordConfirm))
    return cb({
      password: { valid: false, message: "Passwords do not match" },
      passwordConfirm: { valid: false, message: "" },
    });
  if (findUser(email, userDataObject)) return cb({ email: { valid: false, message: "Email address already in use" } });
  // Everything is OK
  let id;
  do {
    id = generateRandomString(USER_ID_LENGTH, charsetbase64);
  } while (id in userDataObject);
  const encryptedPassword = bcrypt.hashSync(password, 10);
  userDataObject[id] = { id, email, encryptedPassword };
  return cb(null, { id, email });
};

const setCookie = function(req, userID) {
  req.session.user = userID;
  return true;
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
    if (value.public || value.userID === res.locals.user.id) return true;
  });
  return next();
};

// --------------------------------
// Index
// --------------------------------
app.get("/", (req, res) => {
  res.redirect(301, "/urls");
});

app.get("/urls.json", getURLindex, (req, res) => {
  res.json(res.locals.urls);
});

app.get("/urls", getURLindex,  (req, res) => {
  res.render("urls_index");
});

// --------------------------------
// Authentication
// --------------------------------

app.get("/login", (req, res) => {
  res.render("auth_login");
});

app.get("/register", (req, res) => {
  res.render("auth_register");
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
    return res.redirect(`/user/${user.id}?status=welcome`); // Set status query variable to trigger welcome message
  });
});

// TODO Error display in client(?)
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log(`Login: ${email} password: ${password}`);
  // Check that user exists and password is correct
  const user = findUser(email, users);
  console.log(`user: `, user);
  if (!user || !validPassword(password, user)) {
    res.status(403);
    return res.render("auth_login");
  }
  setCookie(req, user.id);
  return res.redirect(`/user/${user.id}`);
});

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/urls`);
});

app.get("/user/:userID", (req, res) => {
  const legalStatus = ["welcome"];
  const status = legalStatus.includes(req.query.status) ? req.query.status : null;
  const user = getUser(req.params.userID, users);
  res.render("user", { user, status });
});

// --------------------------------
// Record Mutation
// --------------------------------

// POST New short URL creation form handler
app.post("/urls", (req, res) => {
  const url = addURL(req.body.longURL, req.session.user, false);
  res.redirect(`/urls/${url.shortID}`);
});

// New URL creation form
app.get("/urls/new", checkAuth, (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_new", templateVars);
});

// DELETE Remove short URL button handler
app.post("/urls/:shortURL/delete", (req, res) => {
  // Error if shortID not valid
  if (!(req.params.shortURL in urlDatabase)) {
    const templateVars = { shortURL: req.params.shortURL };
    res.status(404).render("error_NotFound", templateVars);
    return;
  }
  // Delete the key and redirect to index
  console.log(`DELETE shortID ${req.params.shortURL} longURL: ${urlDatabase[req.params.shortURL]}`);
  delete urlDatabase[req.params.shortURL];
  res.redirect(302, "/urls");
});

// UPDATE Edit short URL form handler
app.post("/urls/:shortURL", (req, res) => {
  // Error if shortID not valid
  if (!(req.params.shortURL in urlDatabase)) {
    const templateVars = { shortURL: req.params.shortURL };
    res.status(404).render("error_NotFound", templateVars);
    return;
  }
  // Save edit to the URLdatabase object
  console.log(`UPDATE shortID ${req.params.shortURL} longURL: ${req.body.longURL}`);
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(302, "/urls");
});

// --------------------------------
// Short URLs
// --------------------------------

app.get("/urls/:shortURL", (req, res) => {
  // Error if shortID not valid
  if (!(req.params.shortURL in urlDatabase)) {
    const templateVars = { shortURL: req.params.shortURL };
    res.status(404).render("error_NotFound", templateVars);
    return;
  }
  // Render shortURL page
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// Handle shortURLs-- redirect to long URL
app.get("/u/:shortURL", (req, res) => {
  // Error if shortID not valid
  if (!(req.params.shortURL in urlDatabase)) {
    const templateVars = { shortURL: req.params.shortURL };
    res.status(404).render("error_NotFound", templateVars);
    return;
  }
  // Redirect to long URL
  res.redirect(301, urlDatabase[req.params.shortURL]);
});

// --------------------------------
// Errors
// --------------------------------

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.status = err.status;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  console.log(err);
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// --------------------------------
// Server Start
// --------------------------------

// Server start message
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
