// Serverless function entry point for Vercel
// This imports the bundled NestJS application using dynamic import
let handler;

module.exports = async (req, res) => {
  if (!handler) {
    const module = await import('../dist/main.js');
    handler = module.default;
  }
  return handler(req, res);
};
