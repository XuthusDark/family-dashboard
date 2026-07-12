# Family Dashboard — Setup

## Architecture

```
Ubuntu server  →  backend (Node.js, port 3001)
Raspberry Pi   →  Chromium kiosk pointing at http://<ubuntu-ip>:5173
                  (or the built static files served by the backend)
```

---

## 1. Ubuntu Backend

```bash
cd family-dashboard/backend
cp .env.example .env
# Edit .env: set WEATHER_LAT, WEATHER_LON, WEATHER_TIMEZONE for your location
npm install
npm start
```

Data is stored in `backend/data/dashboard.json` — back this up to save your tile config.

To run permanently (systemd):
```bash
sudo nano /etc/systemd/system/family-dashboard.service
```
```ini
[Unit]
Description=Family Dashboard Backend
After=network.target

[Service]
WorkingDirectory=/home/YOUR_USER/family-dashboard/backend
ExecStart=/usr/bin/node src/index.js
Restart=always
User=YOUR_USER
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable --now family-dashboard
```

---

## 2. Frontend (dev mode, for Pi on same network)

```bash
cd family-dashboard/frontend
npm install
npm run dev
# Access at http://<ubuntu-ip>:5173
```

Or build static files and serve from backend:
```bash
npm run build
# Copy dist/ to backend/public/ (add static serving to index.js)
```

---

## 3. Raspberry Pi Kiosk Mode

Install Chromium and set it to launch on boot pointing at your Ubuntu server:

```bash
# /home/pi/.config/lxsession/LXDE-pi/autostart
@chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --disable-session-crashed-bubble \
  http://192.168.1.XXX:5173
```

Disable screen blanking:
```bash
# Add to autostart:
@xset s off
@xset -dpms
@xset s noblank
```
Night mode (software dim) is handled automatically by the dashboard itself.
For full screen-off via HDMI: the dashboard can call a `/api/screen` endpoint later.

---

## 4. Admin Access

- **Long-press** anywhere on the screen for 600ms to open the PIN prompt
- First-time: enter any 4-digit PIN — it will be set as the admin PIN
- Admin panel: add/edit/remove tiles, change theme colors, configure night mode
- Tiles can drag/resize when admin is unlocked; lock returns to kiosk mode

---

## 5. Location Setup

Edit `backend/.env`:
```
WEATHER_LAT=42.3601    # your latitude
WEATHER_LON=-71.0589   # your longitude
WEATHER_TIMEZONE=America/New_York
```
Or update via the backend DB at `backend/data/dashboard.json` → `settings.location`.

---

## Tile Roadmap

| Status | Tile |
|--------|------|
| ✅ | Clock / Date |
| ✅ | Weather (current, hourly, 7-day) |
| ✅ | News headlines (AP, configurable RSS) |
| ✅ | Countdown to event |
| 🔜 | Google Calendar (OAuth required) |
| 🔜 | Traffic / commute (Google Maps API) |
| 🔜 | Comics (GoComics RSS + scraper) |
| 🔜 | Weather radar (RainViewer) |
| 🔜 | Bus tracker (My Ride K-12 reverse eng.) |
