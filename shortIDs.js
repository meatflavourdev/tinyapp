// shortID.js
const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const maxInt = 56800235583;
const base62 = 62;

const generateRandomString = function() {
  let value = generateRandomInt(maxInt);
  let result = [];
  while (value > 0) {
    result.push(charset[value % base62]);
    value = Math.floor(value / base62);
  }
  return result.join('');
};


const generateRandomInt = function(max) {
  return Math.floor(Math.random() * max);
};

module.exports = { generateRandomString, generateRandomInt };
