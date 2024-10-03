const { phone } = require('phone');

const formattedName = (name) => {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

const formattedPhone = (phoneNumber) => {
  return phone(phoneNumber, {country: `DE`}).isValid ? 
    phone(phoneNumber, {country: `DE`}).phoneNumber : 
    phone(phoneNumber).phoneNumber;
}

const toKebabCase = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()                      
    .replace(/\s+/g, '-');       
}

module.exports = {
  formattedName,
  formattedPhone,
  toKebabCase,
};