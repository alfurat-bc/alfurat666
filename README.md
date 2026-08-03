# Murdoch University Survey System - Vercel Deployment Guide

## Project Structure

```
murdoch-survey/
├── api/                    # Python Flask Backend
│   ├── index.py           # Main Flask application
│   └── requirements.txt   # Python dependencies
├── client/                 # React Frontend
│   ├── src/               # Source code
│   ├── dist/              # Build output
│   └── package.json
├── dist/client/           # Built frontend (generated)
├── vercel.json            # Vercel configuration
└── data/                  # JSON database (auto-created)
```

## Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/murdoch-survey)

### Option 2: Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 3: Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Vercel will auto-detect the configuration from `vercel.json`

## Environment Variables (Required for Production)

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `JWT_SECRET` | `your-secure-secret-key` | Secret key for JWT tokens |
| `ADMIN_EMAIL` | `admin@your-domain.com` | Super admin email |
| `ADMIN_PASSWORD` | `YourSecurePassword123!` | Super admin password |
| `BASE_URL` | `https://your-project.vercel.app` | Your Vercel domain |

## Features

### Frontend (English)
- Survey submission page (public)
- Participant information sheet
- Responsive design

### Backend (Chinese Admin)
- User authentication (JWT)
- Survey management (CRUD)
- Response analytics with charts
- CSV export
- QR code generation
- User management (Super Admin)

## Default Admin Account

After first deployment, the system will auto-create:

- **Email**: Set via `ADMIN_EMAIL` env variable
- **Password**: Set via `ADMIN_PASSWORD` env variable
- **Role**: Super Admin

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Change password

### Surveys
- `GET /api/surveys` - List published surveys
- `GET /api/surveys/:id` - Get survey details
- `POST /api/surveys` - Create survey (auth)
- `PUT /api/surveys/:id` - Update survey (auth)
- `DELETE /api/surveys/:id` - Delete survey (auth)
- `POST /api/surveys/:id/publish` - Publish/unpublish
- `GET /api/surveys/:id/qrcode` - Get QR code

### Responses
- `POST /api/surveys/:id/responses` - Submit response (public)
- `GET /api/surveys/:id/responses` - Get responses (owner)
- `GET /api/surveys/:id/analytics` - Get analytics (owner)
- `GET /api/surveys/:id/export` - Export CSV (owner)

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/toggle-active` - Toggle user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/surveys` - List all surveys
- `DELETE /api/admin/surveys/:id` - Delete any survey
- `GET /api/admin/stats` - Platform statistics

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+

### Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/murdoch-survey
cd murdoch-survey

# Install frontend dependencies
cd client && npm install && cd ..

# Install Python dependencies
pip install -r api/requirements.txt

# Start frontend (dev mode)
cd client && npm run dev

# In another terminal, start Python backend
python api/index.py
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Database

The system uses a JSON file for data storage (`data/survey_data.json`).
For production, consider migrating to a proper database (PostgreSQL, MySQL, etc.).

## Support

For issues or questions, please create an issue on GitHub.
