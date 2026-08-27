import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Minimal Health Check Verification Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI-Assisted Smart Task & Workflow Hub Server is running.',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
