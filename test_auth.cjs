const crypto = require('crypto');

// Function to hash password with SHA256 (same as in the backend)
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Test the hashing function
const testPassword = "test123";
const hashed = hashPassword(testPassword);

console.log("Original password:", testPassword);
console.log("Hashed password:", hashed);
console.log("Hash length:", hashed.length);