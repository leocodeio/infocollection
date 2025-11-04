// Re-export the serverless handler from the built main.js
// This file serves as the Vercel serverless function entry point
module.exports = require('../dist/main').default;
