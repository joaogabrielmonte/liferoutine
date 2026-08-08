const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// In-memory support tickets store inside Metro bundler to sync Mobile & Web dev sessions
let devTickets = [];

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // API Route for Support Tickets (/api/tickets)
      if (req.url && req.url.startsWith('/api/tickets')) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          return res.end();
        }

        if (req.method === 'GET') {
          res.statusCode = 200;
          return res.end(JSON.stringify(devTickets));
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const ticket = JSON.parse(body);
              devTickets = [ticket, ...devTickets];
              res.statusCode = 200;
              return res.end(JSON.stringify({ success: true, tickets: devTickets }));
            } catch (e) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }

        if (req.method === 'PUT') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { id, status } = JSON.parse(body);
              devTickets = devTickets.map((t) => (t.id === id ? { ...t, status } : t));
              res.statusCode = 200;
              return res.end(JSON.stringify({ success: true, tickets: devTickets }));
            } catch (e) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }
      }

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
