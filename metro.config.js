const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Intercept all Metro Web HTTP responses and replace import.meta dynamically before sending to Chrome
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Only intercept for web platform bundle requests to avoid crashing native bundlers
      if (req.url && req.url.includes('platform=web') && req.url.includes('.bundle')) {
        const chunks = [];
        const originalWrite = res.write;
        const originalEnd = res.end;

        res.write = function (chunk, encoding, callback) {
          if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
          }
          return true;
        };

        res.end = function (chunk, encoding, callback) {
          if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
          }
          let body = Buffer.concat(chunks).toString('utf8');

          // Replace import.meta with browser-safe object
          if (body.includes('import.meta')) {
            body = body.replace(
              /import\.meta/g,
              '({ url: typeof location !== "undefined" ? location.href : "", hot: null, env: typeof process !== "undefined" ? process.env : {} })'
            );
          }

          if (!res.headersSent) {
            res.setHeader('Content-Length', Buffer.byteLength(body));
          }
          originalWrite.call(res, body, 'utf8');
          return originalEnd.call(res, callback);
        };
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
