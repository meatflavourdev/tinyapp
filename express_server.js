const express = require("express");
const app = express();
const PORT = 3000; // default port 8080

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

app.get('/hello', (req, res) => {
  res.send('<html><body><h1>Hello World</h1></body></html>');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
