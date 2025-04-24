// backend/server.js
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/convert', (req, res) => {
  const code = req.body.code;
  const command = `python converter.py "${code.replace(/"/g, '\\"')}"`;

  exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr });
    }
    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Invalid output from Python script' });
    }
  });
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));
