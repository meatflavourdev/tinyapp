const express = require("express");
const app = express();
const PORT = 3000; // default port 8080
const ENV = 'development';

// config variables
const shortURLlength = 6;

// Middleware
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// Set view engine
app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


/**
 * Output to console if in development environment
 * @param  {...any} ...args Variables or strings to output to console
 */
const devlog = function(...args) {
  if(ENV === 'development') {
    console.log(...args);
  }
};

console.log(users);

// TODO Find way to organize routes-- This is a mess!

app.use(function(req, res, next) {
  res.locals.username = req.cookies.username;
  next();
});

// --------------------------------
// Index
// --------------------------------
app.get('/', (req, res) => {
  res.redirect(301, '/urls');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls : urlDatabase };
  res.render('urls_index', templateVars);
});

// --------------------------------
// Authentication
// --------------------------------

app.get('/register', (req, res) => {
  res.render('auth_register');
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  console.log(`Login: ${username}`);
  // Set 'username' for 'mins'
  const mins = 5;
  res.cookie('username', username, { expires: new Date(Date.now() + mins * 60000), httpOnly: true });
  res.redirect(`/urls`);
});

app.get('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect(`/urls`);
});

// --------------------------------
// Record Mutation
// --------------------------------

// POST New short URL creation form handler
app.post('/urls', (req, res) => {
  const { charsetbase64, generateRandomString } = require('./shortIDs');
  const shortID = generateRandomString(shortURLlength, charsetbase64);
  console.log(`CREATE shortID ${shortID} longURL: ${req.body.longURL}`);
  urlDatabase[shortID] = req.body.longURL;
  res.redirect(`/urls/${shortID}`);
});

// New URL creation form
app.get('/urls/new', (req, res) => {
  const templateVars = { urls : urlDatabase };
  res.render('urls_new', templateVars);
});

// DELETE Remove short URL button handler
app.post('/urls/:shortURL/delete', (req, res) => {
  // Error if shortID not valid
  if (!(req.params.shortURL in urlDatabase)) {
    const templateVars = { shortURL: req.params.shortURL };
    res.status(404).render('error_NotFound', templateVars);    return;
  }
  // Delete the key and redirect to index
  console.log(`DELETE shortID ${req.params.shortURL} longURL: ${urlDatabase[req.params.shortURL]}`);
  delete urlDatabase[req.params.shortURL];
  res.redirect(302, '/urls');
});

// UPDATE Edit short URL form handler
app.post('/urls/:shortURL', (req, res) => {
  // Error if shortID not valid
  if (!(req.params.shortURL in urlDatabase)) {
    const templateVars = { shortURL: req.params.shortURL };
    res.status(404).render('error_NotFound', templateVars);
    return;
  }
  // Save edit to the URLdatabase object
  console.log(`UPDATE shortID ${req.params.shortURL} longURL: ${req.body.longURL}`);
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(302, '/urls');
});

// --------------------------------
// Short URLs
// --------------------------------

app.get('/urls/:shortURL', (req, res) => {
  // Error if shortID not valid
  if (!(req.params.shortURL in urlDatabase)) {
    const templateVars = { shortURL: req.params.shortURL };
    res.status(404).render('error_NotFound', templateVars);    return;
  }
  // Render shortURL page
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('urls_show', templateVars);
});

// Handle shortURLs-- redirect to long URL
app.get('/u/:shortURL', (req, res) => {
  // Error if shortID not valid
  if (!(req.params.shortURL in urlDatabase)) {
    const templateVars = { shortURL: req.params.shortURL };
    res.status(404).render('error_NotFound', templateVars);    return;
  }
  // Redirect to long URL
  res.redirect(301, urlDatabase[req.params.shortURL]);
});

// --------------------------------
// Errors
// --------------------------------

// Handle 404 errors on other routes
app.use(function(req, res) {
  res.status(404).render('error_404');
});

// --------------------------------
// Server Start
// --------------------------------

// Server start message
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
