import express from 'express';
import cors from 'cors';
import analyzeRoutes from './routes/analyzer.routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/', analyzeRoutes);

export default app;
