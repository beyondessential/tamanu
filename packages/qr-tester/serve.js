const chalk = require('chalk');
const httpServer = require('http-server');
const path = require('path');
const rl = require('readline');
const opener = require('opener');

function logFn (req, res, error) {
  const date = new Date;
  const ip = req.headers['x-forwarded-for'] || '' +  req.connection.remoteAddress;
  if (error) {
    console.log(
      '[%s] %s "%s %s" Error (%s): "%s"',
      date, ip, chalk.red(req.method), chalk.red(req.url),
      chalk.red(error.status.toString()), chalk.red(error.message)
    );
  }
  else {
    console.log(
      '[%s] %s "%s %s" "%s"',
      date, ip, chalk.cyan(req.method), chalk.cyan(req.url),
      req.headers['user-agent']
    );
  }
}

const root = path.join(__dirname, 'www');
const server = httpServer.createServer({
  root, logFn,
  https: {
    key: path.join(__dirname, 'server.key'),
    cert: path.join(__dirname, 'server.crt'),
  }
});

const port = 9128;
const host = '0.0.0.0';
server.listen(port, host, function () {
  console.log(`${chalk.yellow('Starting up')}: https://localhost:${chalk.green(port.toString())}`);
  console.log(chalk.magenta('Hit CTRL-C to stop the server'));
  opener(`https://localhost:${port}`);
  console.log('---');
});

if (process.platform === 'win32') {
  rl.createInterface({
    input: process.stdin,
    output: process.stdout
  }).on('SIGINT', function () {
    process.emit('SIGINT');
  });
}

process.on('SIGINT', function () {
  console.log(chalk.red('stopping.'));
  process.exit();
});

process.once('SIGTERM', function () {
  console.log(chalk.red('stopping.'));
  process.exit();
});
