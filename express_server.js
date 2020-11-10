const express = require("express");
const app = express();
const PORT = 3000; // default port 8080

// Body Parser Middleware - Converts request body from Buffer to String
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls : urlDatabase };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  console.log(`longURL: ${req.body.longURL}`);
  const { generateRandomString } = require('./shortIDs');
  urlDatabase[generateRandomString()] = req.body.longURL;
  res.send('OK');
});

app.get('/urls/new', (req, res) => {
  const templateVars = { urls : urlDatabase };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  res.render('urls_show');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
