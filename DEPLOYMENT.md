# Deployment Guide for Vercel

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- GitHub repository connected to Vercel
- Backend deployed (already on Render at `https://vhelp-game.onrender.com`)

## Steps to Deploy Frontend to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "Add New Project"

2. **Import Your Repository**
   - Connect your GitHub account if not already connected
   - Select the `vhelp-game` repository
   - Click "Import"

3. **Configure Project Settings**
   - **Root Directory**: Leave as root (or set to `frontend` if you prefer)
   - **Framework Preset**: Other (or React if available)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `cd frontend && npm install`

4. **Environment Variables** (if needed)
   - Add any environment variables your frontend needs
   - Currently, the socket URL is hardcoded in `frontend/src/socket.js`

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Select the project settings
   - Deploy!

4. **For Production Deployment**
   ```bash
   vercel --prod
   ```

## Important Notes

### Backend Deployment
- Your backend is already deployed on Render at `https://vhelp-game.onrender.com`
- The frontend's `socket.js` is configured to connect to this backend
- Make sure your backend is running and accessible

### Environment Variables
If you need to change the backend URL dynamically, you can:
1. Add `REACT_APP_SOCKET_URL` environment variable in Vercel
2. Update `frontend/src/socket.js` to use:
   ```js
   const socket = io(process.env.REACT_APP_SOCKET_URL || 'https://vhelp-game.onrender.com');
   ```

### Custom Domain
- After deployment, you can add a custom domain in Vercel settings
- Go to Project Settings > Domains
- Add your domain and follow DNS configuration instructions

## Troubleshooting

### Build Fails
- Check that all dependencies are in `frontend/package.json`
- Ensure Node.js version is compatible (currently set to 24.x)
- Check build logs in Vercel dashboard

### Socket Connection Issues
- Verify backend is running on Render
- Check CORS settings in backend
- Ensure socket URL in `frontend/src/socket.js` matches your backend URL

### Routing Issues
- The `vercel.json` includes a rewrite rule for React Router
- All routes should redirect to `/index.html` for client-side routing

## Post-Deployment Checklist

- [ ] Test the app on the Vercel URL
- [ ] Verify socket connection works
- [ ] Test all game features (matchmaking, questions, chat)
- [ ] Check mobile responsiveness
- [ ] Set up custom domain (optional)
- [ ] Configure environment variables if needed

