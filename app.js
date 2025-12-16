// Import Express.js
const express = require('express');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// Route for GET requests
app.get('/', (req, res) => {
    const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('WEBHOOK VERIFIED');
        res.status(200).send(challenge);
    } else {
        console.log('WEBHOOK VERIFICATION FAILED');
        res.status(403).end();
    }
});

// Route for POST requests
app.post('/', (req, res) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    console.log(`\n\nWebhook received ${timestamp}\n`);
    console.log(JSON.stringify(req.body, null, 2));
    res.status(200).end();
});

app.delete('/',(req,res) => {
    shutdown();
})

// Start the server
app.listen(port, () => {
    console.log(`\nListening on port ${port}\n`);
});

function shutdown() {
    console.log('signal received. Starting graceful shutdown.');

    // Perform cleanup operations here
    app.close(() =>    {

    console.log('Cleanup finished. Exiting.');
    process.exit(0); // Exit the process cleanly

    });
    // Force close the server after 5 seconds
    setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
      }, 5000);
}

// Listen for SIGs
process.on('SIGTERM', shutdown );
process.on('SIGINT', shutdown );