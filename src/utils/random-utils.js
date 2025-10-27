function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min, max, decimals = 6) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

module.exports = { randomInt, randomDecimal, randomString };
