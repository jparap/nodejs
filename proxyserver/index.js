let http    = require('http');
let request = require('request');
let fs      = require('fs');
let argv    = require('yargs').default('host', '127.0.0.1').argv;

let scheme = 'http://'
let port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80);
let destinationUrl = argv.url || scheme + argv.host + ':' + port;
let logPath = argv.log && path.join(__dirname, argv.log);
let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout;

// Echo server: on 8000
http.createServer((req, res) => {
  console.log(`Echo server - received request at: ${destinationUrl + req.url}`);
  logStream.write(`\n\n\n${req.method} ${req.url}\n`);
  logStream.write(`${JSON.stringify(req.headers)}\n\n`);

  for (let header in req.headers) {
    res.setHeader(header, req.headers[header]);
  }
  req.pipe(logStream, {end: false});
  req.pipe(res, {end: false});
}).listen(8000);



// Proxy Server: on 8001
http.createServer((req, res) => {
  var url = req.headers['x-destination-url'] || destinationUrl;
  console.log(`Proxy server - forward request to: ${url + req.url}`);

  var options = {
    headers: req.headers,
    url: url + req.url,
    method: req.method
  };

// Log the req headers and content in the **server callback**
  logStream.write(`\n\n\n${req.method} ${req.url}\n`);
  logStream.write(`${JSON.stringify(req.headers)}\n\n`);
  req.pipe(logStream, {end: false});


// Log the proxy request headers and content in the **server callback**
  let downstreamResponse = req.pipe(request(options));
  logStream.write("\n\nDownstream response:\n");
  logStream.write(JSON.stringify(downstreamResponse.headers));
  downstreamResponse.pipe(logStream, {end: false});
  downstreamResponse.pipe(res, {end: false});


}).listen(8001);