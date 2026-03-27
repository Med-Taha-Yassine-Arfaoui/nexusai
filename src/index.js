const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ 
    message: "NexusAI API is online 🚀",
    status: "operational",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
