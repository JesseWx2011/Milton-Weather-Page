const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const { URL } = require('url');
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

/*
  New: Image proxy for weather-models to avoid CORS errors when the browser
  attempts to load images from pivotalweather hosts. Keeps camera proxies above.
  Usage: /proxy/image?url=<encoded-image-url>
  Only allows requests to configured trusted hosts to avoid open proxy.
*/

const ALLOWED_HOSTS = [
    'm1o.pivotalweather.com',
    'm2o.pivotalweather.com',
    'pivotalweather.com',
    'api.pivotalweather.com'
];

function isAllowedHost(hostname) {
    if (!hostname) return false;
    return ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h));
}

app.get('/proxy/image', (req, res) => {
    const raw = req.query.url;
    if (!raw) return res.status(400).json({ error: 'url query parameter is required' });

    let parsed;
    try {
        parsed = new URL(raw);
    } catch (err) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    if (!isAllowedHost(parsed.hostname)) {
        return res.status(403).json({ error: 'Host not allowed' });
    }

    const client = parsed.protocol === 'http:' ? http : https;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        // Provide a sensible referer so some hosts that block unknown referers will accept it.
        'Referer': req.get('Origin') || req.get('Referer') || 'https://jessewx2011.github.io',
        'Accept': '*/*'
    };

    const requestOptions = {
        headers,
        timeout: 15000
    };

    const proxiedReq = client.get(parsed.toString(), requestOptions, (targetRes) => {
        // Always set permissive CORS headers for the response to the browser
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

        // Preserve content-type if available
        if (targetRes.headers['content-type']) {
            res.setHeader('Content-Type', targetRes.headers['content-type']);
        } else {
            res.setHeader('Content-Type', 'application/octet-stream');
        }

        // Forward status codes (404, 403, etc.) and pipe response stream
        res.statusCode = targetRes.statusCode || 200;
        targetRes.pipe(res);
    });

    proxiedReq.on('timeout', () => {
        proxiedReq.destroy(new Error('Request timed out'));
    });

    proxiedReq.on('error', (err) => {
        console.error('Image proxy error for', raw, err && err.message);
        // Ensure CORS headers even on error so the browser doesn't show CORS-blocked failures
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.status(502).json({ error: 'Failed to fetch remote image', details: (err && err.message) || 'unknown' });
    });
});

// OPTIONS preflight for image proxy
app.options('/proxy/image', (req, res) => {
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
