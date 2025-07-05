# Network Setup Guide

This guide explains how to configure Kingdom of Chaos for network access (when other devices need to connect to your game server).

## Environment Variables

### Frontend (.env file in frontend directory)

Create a `.env` file in the `frontend/` directory with:

```bash
# For network access - replace with your actual IP
REACT_APP_API_URL=http://192.168.1.100:3001/api
REACT_APP_SOCKET_URL=http://192.168.1.100:3001
```

### Backend (.env file in backend directory)

Create a `.env` file in the `backend/` directory with:

```bash
# Allow frontend connections from network
FRONTEND_URL=http://192.168.1.100:3000
```

### Testing (.env file in root directory)

Create a `.env` file in the root directory for Playwright tests:

```bash
# For testing via network IP
PLAYWRIGHT_BASE_URL=http://192.168.1.100:3000
FRONTEND_URL=http://192.168.1.100:3000
```

## Quick Setup

1. **Find your IP address:**
   ```bash
   # On macOS/Linux:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # On Windows:
   ipconfig | findstr "IPv4"
   ```

2. **Replace `192.168.1.100` in the examples above with your actual IP address**

3. **Create the environment files as shown above**

4. **Restart both frontend and backend servers**

## Automatic Detection

The app now automatically detects whether it's being accessed via:
- `localhost` → connects to `localhost:3001`
- IP address → connects to `same-ip:3001`

So in most cases, you won't need environment variables unless you want to override the default behavior.

## Troubleshooting

### If signup/login fails when accessing via IP:
- Check that backend CORS is configured for your IP
- Verify the backend is accessible at `http://your-ip:3001/api/participants`

### If answer submission freezes when accessing via IP:
- Check WebSocket connection in browser dev tools
- Verify WebSocket CORS is configured for your IP
- Check firewall settings on the host machine

### If tests fail:
- Set `PLAYWRIGHT_BASE_URL` environment variable
- Or run with: `PLAYWRIGHT_BASE_URL=http://your-ip:3000 npm test` 