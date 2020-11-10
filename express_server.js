const express = require("express");
const app = express();
const PORT = 3000; // default port 8080

// config variables
const shortURLlength = 6;

// Body Parser Middleware - Converts request body from Buffer to String
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls : urlDatabase };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  console.log(`longURL: ${req.body.longURL}`);
  const { charsetbase64, generateRandomString } = require('./shortIDs');
  const shortID = generateRandomString(shortURLlength, charsetbase64);
  urlDatabase[shortID] = req.body.longURL;
  res.redirect(`/urls/${shortID}`);
});

app.get('/urls/new', (req, res) => {
  const templateVars = { urls : urlDatabase };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  // Error if shortID not found
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).render('error_404');
    return;
  }
  // Render shortURL page
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('urls_show', templateVars);
});

// Handle shortURLs-- redirect to long URL
app.get('/u/:shortURL', (req, res) => {
  // Error if shortID not found
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).render('error_404');
    return;
  }
  // Redirect to long URL
  res.redirect(301, urlDatabase[req.params.shortURL]);
});

// @TODO Handle 404 errors on other routes

// Server start message
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
