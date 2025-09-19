const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Test server working' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(3000, () => {
  console.log('Test server running on port 3000');
});
