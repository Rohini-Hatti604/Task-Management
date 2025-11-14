# Task Management Application

A full-stack task management application with projects, tasks, and team collaboration features.

## Features

-  **User Authentication**: JWT-based sign up, log in, log out
-  **Projects Management**: Create, update, delete projects
-  **Tasks Management**: Create tasks with title, description, assignee, due date, and status
-  **Kanban Board**: Drag-and-drop task board with sections (To Do, In Progress, Done)
-  **User Management**: Projects can have multiple members; only project members can manage tasks
-  **Responsive UI**: Mobile-friendly design
-  **Error Handling**: Comprehensive error handling with user feedback

## Tech Stack

### Frontend
- React 19
- Redux Toolkit for state management
- Material-UI (MUI) for UI components
- React DnD for drag-and-drop
- Axios for API calls

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- RESTful API

## Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=4000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:4000/api
```

4. Start the development server:
```bash
npm start
```

## Deployment

### Backend Deployment (Render/Heroku/Railway)

1. Create account on your preferred platform
2. Connect your repository
3. Set environment variables:
   - `PORT` (auto-set by platform)
   - `MONGO_URI`
   - `JWT_SECRET`
4. Deploy

### Frontend Deployment (Vercel/Netlify)

1. Create account on Vercel or Netlify
2. Connect your repository
3. Set environment variables:
   - `REACT_APP_API_URL` (your backend URL)
4. Deploy

### Docker Deployment

1. Update `.env` files with production values
2. Run:
```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/count` - Get total user count
- `GET /api/auth/by-email` - Get user by email
- `GET /api/auth/search` - Search users

### Projects
- `GET /api/project` - Get all projects for user
- `GET /api/project/:id` - Get single project
- `POST /api/project` - Create project
- `PUT /api/project/:id` - Update project
- `DELETE /api/project/:id` - Delete project
- `POST /api/project/:id/members` - Add member
- `DELETE /api/project/:id/members` - Remove member

### Sections
- `GET /api/section?projectId=xxx` - Get sections for project
- `POST /api/section` - Create section
- `PUT /api/section/:id` - Update section
- `DELETE /api/section/:id` - Delete section

### Tasks
- `GET /api/task/:section` - Get tasks by section
- `POST /api/task` - Create task
- `PUT /api/task/:taskId` - Update task
- `DELETE /api/task/:taskId` - Delete task
- `PATCH /api/task/move` - Move task between sections

## Project Structure

```
Task-Management/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── features/
│   │   │   ├── projects/
│   │   │   ├── sections/
│   │   │   ├── tasks/
│   │   │   └── user/
│   │   └── middlewares/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── store/
│   │   ├── Axios/
│   │   └── App.js
│   └── public/
└── README.md
```

## License

MIT

