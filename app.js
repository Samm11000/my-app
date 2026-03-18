const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello! My app is working!');
});

app.get('/check', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Phase 3 complete — Auto deployed via Jenkins CD!',
    deployed_at: new Date(),
    pipeline: 'Jenkinsfile → SSH → EC2 → pm2'
  });
});
app.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} pe`);
});