const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('./db.json');
const data = require('./db.json');
const middlewares = jsonServer.defaults();

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);
// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
  if (req.method === 'POST') {
    req.body.createdAt = Date.now();
  }
  // Continue to JSON Server router
  next();
});
// Add custom routes before JSON Server router
server.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = data.users.find(user => user.email === email);
  if (user) {
    if (user.password === password) {
      res.jsonp({
        token: 'valid_token',
      });
    } else {
      res.sendStatus(400);
    }
  } else {
    res.sendStatus(404);
  }
});

// Use default router
server.use(router);
// server.listen(3000, '192.168.0.28', data => {
//   console.log('JSON Server is running');
// });
module.exports = server;
