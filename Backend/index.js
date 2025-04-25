// backend/server.js
const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.post("/convert", (req, res) => {
  const code = req.body.code;
  console.log("Received Lisp code:", code);

  // Properly escape quotes for command line
  const escapedCode = code.replace(/"/g, '\\"');
  const command = `python converter.py "${escapedCode}"`;

  console.log("Executing command:", command);

  exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
    console.log("stdout:", stdout);
    console.log("stderr:", stderr);

    if (error) {
      console.error("Execution error:", error);
      return res.status(500).json({ error: stderr || error.message });
    }

    try {
      // Try to parse the output as JSON
      const result = JSON.parse(stdout);
      console.log("Parsed result:", result);
      res.json(result);
    } catch (err) {
      console.error("JSON parse error:", err);
      res.status(500).json({
        error: "Failed to parse Python script output",
        rawOutput: stdout,
      });
    }
  });
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));
