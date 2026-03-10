# CompassX Deployment Guide for Koyeb

## Prerequisites
- Koyeb account (https://www.koyeb.com)
- Docker installed locally (for testing)
- GitHub repository with this code

## MongoDB Atlas (Already Configured)
Your MongoDB connection string:
```
mongodb+srv://sethcushing:compassx@compassxprograminsight.htuibk0.mongodb.net/?appName=CompassXProgramInsight
```

Database name: `compassx_prod`

### Important: Whitelist Koyeb IPs
1. Go to MongoDB Atlas > Network Access
2. Add `0.0.0.0/0` (Allow from anywhere) or Koyeb's IP ranges
3. This is required for Koyeb to connect to your Atlas cluster

## Deployment Steps

### Option 1: Deploy via GitHub (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Koyeb deployment"
   git push origin main
   ```

2. **Create Koyeb App**
   - Go to https://app.koyeb.com
   - Click "Create App"
   - Select "GitHub"
   - Connect your repository
   - Select the branch (main)

3. **Configure Build**
   - Builder: Dockerfile
   - Dockerfile path: `Dockerfile`
   - Port: `8000`

4. **Set Environment Variables**
   Add these in Koyeb's environment variables section:
   ```
   MONGO_URL=mongodb+srv://sethcushing:compassx@compassxprograminsight.htuibk0.mongodb.net/?appName=CompassXProgramInsight
   DB_NAME=compassx_prod
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   APP_URL=https://<your-app-name>.koyeb.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~5-10 minutes)

### Option 2: Deploy via Docker Image

1. **Build and push Docker image**
   ```bash
   docker build -t your-dockerhub-username/compassx:latest .
   docker push your-dockerhub-username/compassx:latest
   ```

2. **Deploy on Koyeb**
   - Select "Docker" as source
   - Enter your image: `your-dockerhub-username/compassx:latest`
   - Set port: `8000`
   - Add environment variables (same as above)

## Google OAuth Setup

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - `https://<your-app-name>.koyeb.app/api/auth/callback`
   - `https://demobackend.emergentagent.com/auth/v1/env/oauth/callback` (Emergent)
4. Copy Client ID and Secret to Koyeb env vars

## Post-Deployment

### Verify Deployment
1. Visit `https://<your-app-name>.koyeb.app`
2. Check API health: `https://<your-app-name>.koyeb.app/api/`
3. Should return: `{"message":"CompassX API","version":"1.0.0"}`

### Seed Demo Data
1. Login via Google OAuth
2. Go to Dashboard
3. Click "Load Demo Data"

### Monitor Logs
- Koyeb Dashboard > Your App > Logs

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| MONGO_URL | Yes | MongoDB Atlas connection string |
| DB_NAME | Yes | Database name (compassx_prod) |
| GOOGLE_CLIENT_ID | Yes | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | Yes | Google OAuth client secret |
| APP_URL | Yes | Your Koyeb app URL |

## Troubleshooting

### MongoDB Connection Issues
- Verify IP whitelist in Atlas
- Check connection string format
- Ensure DB_NAME is set

### OAuth Issues
- Verify redirect URIs in Google Console
- Check client ID/secret are correct
- Ensure APP_URL matches your Koyeb domain

### Build Failures
- Check Dockerfile syntax
- Verify all files are committed
- Check Koyeb build logs

## Architecture

```
┌─────────────────────────────────────────┐
│              Koyeb (Port 8000)          │
│  ┌───────────────────────────────────┐  │
│  │            Nginx                   │  │
│  │  - Serves React frontend (/)       │  │
│  │  - Proxies /api/* to backend       │  │
│  └───────────────────────────────────┘  │
│                    │                     │
│  ┌───────────────────────────────────┐  │
│  │     FastAPI Backend (8001)        │  │
│  │  - REST API                        │  │
│  │  - Google OAuth                    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                     │
                     ▼
        ┌───────────────────────┐
        │   MongoDB Atlas       │
        │   (compassx_prod)     │
        └───────────────────────┘
```

## Support
For issues, check Koyeb documentation: https://www.koyeb.com/docs
