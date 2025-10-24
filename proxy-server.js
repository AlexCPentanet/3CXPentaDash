// Simple CORS proxy server for 3CX API
const http = require('http');
const https = require('https');
const url = require('url');

const TARGET_HOST = 'pentanet.3cx.com.au';
const TARGET_PORT = 5001;
const PROXY_PORT = 8080;

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`${req.method} ${req.url}`);

    // Parse the request URL
    const parsedUrl = url.parse(req.url);

    // Prepare options for forwarding request to 3CX
    const options = {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: parsedUrl.path,
        method: req.method,
        headers: {
            ...req.headers,
            host: TARGET_HOST
        },
        rejectUnauthorized: false // Accept self-signed certificates
    };

    // Forward the request to 3CX
    const proxyReq = https.request(options, (proxyRes) => {
        // Copy status code
        res.writeHead(proxyRes.statusCode, proxyRes.headers);

        // Pipe the response back to the client
        proxyRes.pipe(res);
    });

    // Handle errors
    proxyReq.on('error', (err) => {
        console.error('Proxy error:', err.message);
        res.writeHead(500);
        res.end('Proxy error: ' + err.message);
    });

    // Pipe the request body to 3CX
    req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
    console.log('\n========================================');
    console.log('3CX CORS Proxy Server Started');
    console.log('========================================');
    console.log(`Listening on: http://localhost:${PROXY_PORT}`);
    console.log(`Forwarding to: https://${TARGET_HOST}:${TARGET_PORT}`);
    console.log('\nUpdate config.js to use:');
    console.log(`  apiUrl: 'http://localhost:${PROXY_PORT}'`);
    console.log('\nPress Ctrl+C to stop');
    console.log('========================================\n');
});
