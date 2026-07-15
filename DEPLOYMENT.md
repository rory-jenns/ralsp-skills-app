# Deployment Guide

This guide covers deploying the Skills Web App to Netlify (frontend) + Render (backend).

## Prerequisites

- GitHub account with this repository pushed
- Netlify account (free at netlify.com)
- Render account (free at render.com)

## Step 1: Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign up/log in
2. Click **"New +"** → **"Web Service"**
3. Select **"Deploy an existing project from GitHub"**
4. Connect your GitHub account and select this repository
5. Configure the service:
   - **Name**: `skills-app-api` (or any name)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free tier is fine for development

6. Add environment variables:
   - `JWT_SECRET`: Set to a secure random string (e.g., generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `FRONTEND_ORIGIN`: Your Netlify frontend URL (you'll get this after deploying frontend, then update here)
   - `PORT`: `4000`

7. Click **"Create Web Service"**
8. Wait for deployment to complete. Copy the service URL (e.g., `https://skills-app-api.onrender.com`)

## Step 2: Deploy Frontend to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up/log in
2. Click **"Add new project"** → **"Import an existing project"**
3. Select **"GitHub"** and authorize
4. Find and select this repository
5. Configure build settings:
   - **Base directory**: Leave empty
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

6. Click **"Deploy site"**
7. Once deployed, note your Netlify URL (e.g., `https://your-site-name.netlify.app`)

## Step 3: Update Environment Variables

### Backend (Render)
1. Go back to your Render service dashboard
2. Go to **"Environment"** tab
3. Update `FRONTEND_ORIGIN` with your Netlify URL from Step 2
4. The service will redeploy automatically

### Frontend (Netlify)
1. Go to your Netlify site settings
2. Go to **"Site settings"** → **"Build & deploy"** → **"Environment"**
3. Add environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Render backend URL from Step 1 (e.g., `https://skills-app-api.onrender.com`)
4. Trigger a new deploy: **"Deploys"** → **"Trigger deploy"** → **"Deploy site"**

## Step 4: Verify the Deployment

1. Visit your Netlify URL
2. Try logging in or making API calls
3. Check browser console for any errors
4. Check Render logs if backend calls fail

## Troubleshooting

### Cold starts on Render
Free tier Render services spin down after 15 minutes of inactivity. The first request after spin-down takes 10-30 seconds. This is normal.

### CORS errors
Make sure `FRONTEND_ORIGIN` on the backend matches your Netlify URL exactly (including `https://`).

### Build failures
- Check logs: Netlify (Deploys tab) or Render (Logs tab)
- Ensure all dependencies are in `package.json`
- Verify Node version is `>=18` in both root and server `package.json`

## Environment Variables Reference

### Frontend (.env)
```
VITE_API_URL=https://your-render-backend.onrender.com
```

### Backend (server/.env)
```
PORT=4000
JWT_SECRET=your-secret-key-here
FRONTEND_ORIGIN=https://your-netlify-site.netlify.app
```

## Making Changes After Deployment

Simply push to GitHub:
- **Frontend**: Auto-deploys via Netlify on any push to main
- **Backend**: Auto-deploys via Render on any push to main (specifically changes in `server/` folder)

## Database

The backend uses `lowdb` (JSON file database) stored at `server/db.json`. This file persists on Render, but:
- Render free tier may clear files periodically
- Consider migrating to a real database (PostgreSQL, MongoDB) for production

To migrate:
1. Export current data from `server/db.json`
2. Update `server/index.js` to use a different database adapter (MongoDB, PostgreSQL, etc.)
3. Update dependencies and redeploy
