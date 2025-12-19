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
        if(!mode) {
            console.log('naked get'); }
        else {
            console.log('WEBHOOK VERIFICATION FAILED');}

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
const server = app.listen(port, () => {
    console.log(`\nListening on port ${port}\n`);
});

let connections = [];

// Track open connections
server.on('connection', connection => {
    connections.push(connection);
    connection.on('close', () => connections = connections.filter(curr => curr !== connection));
});

app.use((req, res, next) => {
    console.log("a middleware")
    next();
});

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
});

function shutdown() {
    console.log('signal received. Starting graceful shutdown.');

    // Perform cleanup operations here. http server will not close till all open connections close
    server.close(() =>    {
        console.log('Cleanup finished. Exiting.');
        process.exit(0); // Exit the process cleanly

    });
    // Force close the server after 5 seconds
    setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
      }, 5000);

    // Now terminate any remaining open connections
    // This operation is in a race with the actions of server.close()
    // connections.forEach(curr => curr.end());
    // Any that remain open after 4 secs get zapped
    setTimeout(() => connections.forEach(curr => { curr.destroy(); console.log('connection zapped')}), 4000);
}

// Listen for SIGs
process.on('SIGTERM', shutdown );
process.on('SIGINT', shutdown );