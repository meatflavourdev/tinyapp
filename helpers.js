const bcrypt = require('bcrypt');
const validator = require("validator");
const { charsetbase64, charsetbase62, generateRandomString } = require("./shortIDs");
const { USER_ID_LENGTH, SHORTID_LENGTH } = require("./constants");

// --------------------------------
// HELPER FUNCTIONS
// --------------------------------
/**
 * Adds a url to the URL storage
 * @param  {String} longURL The full URL to the link to be shortened
 * @param  {String} userID  The userID of the user shortening a link
 * @param  {boolen} public=false The public visibility setting of the link
 * @return {Object} The created url object
 */
const addURL = function(urlDatabase, longURL, userID, public = false) {
  const shortID = generateRandomString(SHORTID_LENGTH, charsetbase64);
  urlDatabase[shortID] = { shortID, longURL, userID, public };
  return urlDatabase[shortID];
};

/**
 * Retrieve the URL object from the URL storage object
 * @param  {String} id The shortID/shortID
 * @return {Object} Return the url object corresponding with the specified ID or false
 */
const getURL = function(urlDatabase, id) {
  // Error if arguments are falsey
  if (!urlDatabase || !id) return false;
  // Error if shortID not valid
  if (!(id in urlDatabase)) {
    return false;
  }
  return urlDatabase[id];
};

/**
 * Modify an existing url in the URL storage
 * @param  {String} shortID The ID of the URL to modify
 * @param  {String} userID  The userID of the current user
 * @param  {String} longURL The full URL to be updated
 * @param  {boolen} public=false The public visibility setting of the link to be set
 * @return {Object} The modified url object or false
 */
const editURL = function(urlDatabase, shortID, userID, longURL, public) {
  const url = getURL(urlDatabase, shortID);
  if (!url) return false;
  if (userID !== url.userID) return false;
  urlDatabase[shortID].longURL = longURL;
  urlDatabase[shortID].public = public;
  return urlDatabase[shortID];
};

/**
 * Remove an existing url in the URL storage
 * @param  {String} shortID The ID of the URL to modify
 * @param  {String} userID  The userID of the current user
 * @return {boolen} TRUE on success, FALSE on failure
 */
const removeURL = function(urlDatabase, shortID, userID) {
  const url = getURL(urlDatabase, shortID);
  if (!url) return false;
  if (userID !== url.userID) return false;
  delete urlDatabase[shortID];
  return !getURL(shortID);
};

/**
 * Get user object from users stotage object by the user ID
 * @param  {String} userID Primary key identifying user
 * @param {Object} userDataObject An object containing key value pair of userIDs to user objects
 * @return {Object} User object or null
 */
const getUser = function(userID, userDataObject) {
  if(!userID || !userDataObject) return null;
  if (userID in userDataObject) {
    return userDataObject[userID];
  }
  return null;
};

/**
 * Get user object from users stotage object by the email
 * @param  {String} email The user email address
 * @param {Object} userDataObject An object containing key value pair of userIDs to user objects
 * @return {Object} User object or null
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
  const valid = bcrypt.compareSync(password, user.password);
  if (!password || !valid) return false;
  return true;
};

const createUser = function(userInput, userDataObject, cb) {
  const { email, password, passwordConfirm } = userInput;
  if (validator.isEmpty(email)) return cb({ field: ['email'], message: "Please enter an email address" });
  if (!validator.isEmail(email)) return cb({ field: ['email'], message: "Please enter a valid email address" });
  if (validator.isEmpty(password)) return cb({ field: ['password'], message: "Please enter a password" });
  if (validator.isEmpty(passwordConfirm)) return cb({ field: ['passwordConfirm'], message: "Please enter a password confirmation" });
  if (!validator.equals(password, passwordConfirm)) return cb({ field: ['password', 'passwordConfirm'], message: "Passwords do not match" });
  if (findUser(email, userDataObject)) return cb({ field: ['email'], message: "Email address already in use" });
  // Everything is OK
  if (!userDataObject) return false; // Return false, userDataObject does not exist
  let id;
  do {
    id = generateRandomString(USER_ID_LENGTH, charsetbase62);
  } while (id in userDataObject);
  const encryptedPassword = bcrypt.hashSync(password, 10);
  userDataObject[id] = { id, email, password: encryptedPassword };
  return cb(null, userDataObject[id]);
};

const setCookie = function(req, userID) {
  req.session.user = userID;
  return true;
};

module.exports = { addURL, createUser, editURL, findUser, getURL, getUser, removeURL, setCookie, validPassword };
