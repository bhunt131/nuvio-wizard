const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve the static index.html file
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for root
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Nuvio Provisioning Server running on port ${PORT}`));
