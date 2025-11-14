import express from 'express';
import dotenv from 'dotenv';
import connectDB from './src/config/db.config.js';
import bodyParser from 'body-parser';
import sectionRouter from './src/features/sections/section.routes.js';
import taskRouter from './src/features/tasks/task.routes.js';
import userRouter from './src/features/user/user.routes.js';
import projectRouter from './src/features/projects/project.routes.js';
import commentRouter from './src/features/comments/comment.routes.js';
import activityRouter from './src/features/activity/activity.routes.js';
import cors from "cors";
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();


app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);  // Allow all origins
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,  // Allow cookies & authentication
}));


// Middleware
app.use(bodyParser.json());

// Ensure uploads folder exists and serve static files
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/project', projectRouter);
app.use('/api/section', sectionRouter);
app.use('/api/task', taskRouter);
app.use('/api/auth', userRouter);
app.use('/api', commentRouter);
app.use('/api', activityRouter);

// Connect to database
connectDB();

// Start server
const port = process.env.PORT || 4000;
app.get('/', (req, res) => {
  res.send('Welcome to Kanban Board API');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




