const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Resolve IPv6/IPv4 lookup priority issue in Node.js for MongoDB SRV records
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
if (dns.setServers) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

console.log('Testing MongoDB connection...');
console.log('URI:', uri ? uri.replace(/:([^@]+)@/, ':****@') : 'Undefined'); // Mask password for safety

if (!uri) {
  console.error('❌ Error: MONGODB_URI is not defined in your .env file!');
  process.exit(1);
}

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Success: Successfully connected to MongoDB Database!');
    console.log('Database name:', mongoose.connection.name);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection Failed!');
    console.error('Error Details:', err.message);
    
    if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.log('\n💡 Suggestion: The username or password in your MONGODB_URI might be incorrect.');
    } else if (err.message.includes('queryTxt ETIMEOUT') || err.message.includes('ENOTFOUND')) {
      console.log('\n💡 Suggestion: Network error. Check your internet connection or cluster URL.');
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('connection timed out')) {
      console.log('\n💡 Suggestion: This might be an IP Whitelisting issue. Make sure that IP 0.0.0.0/0 (allow access from anywhere) is whitelisted in your MongoDB Atlas dashboard under Security -> Network Access.');
    }
    
    process.exit(1);
  });
