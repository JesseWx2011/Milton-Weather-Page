const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Proxy endpoint for the traffic camera stream
app.get('/proxy/traffic-camera', (req, res) => {
    const targetUrl = 'https://dim-se3.divas.cloud:8200/chan-6573/stream.m3u8';
    const token = req.query.token;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    const options = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*',
            'Origin': 'https://dim-se3.divas.cloud',
            'Referer': 'https://dim-se3.divas.cloud/'
        }
    };

    https.get(`${targetUrl}?token=${token}`, options, (targetRes) => {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        
        // Set content type
        res.setHeader('Content-Type', targetRes.headers['content-type'] || 'application/x-mpegURL');
        
        // Pipe the response
        targetRes.pipe(res);
    }).on('error', (err) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Failed to fetch stream' });
    });
});

// Add OPTIONS handler for CORS preflight requests
app.options('/proxy/traffic-camera', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.status(200).end();
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`CORS proxy server running on port ${PORT}`);
}); 