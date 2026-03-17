const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello! My app is working!');
});

app.get('/check', (req, res) => {
  res.json({
    status: 'OK',
    message: 'App is running fine!',
    timestamp: new Date()
  });
});

app.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} pe`);
});