# CFE Dashboard

Customer-Facing Engineering Dashboard - A Vue.js 3 application for monitoring tasks, projects, and developer occupancy.

## Features

- **Task Management**: Kanban board with drag-and-drop, task sizing (S/M/L/XL), priority tracking
- **Project Monitoring**: Progress tracking based on estimated hours (weighted)
- **Developer Occupancy**: Real-time workload tracking with high/low occupancy views
- **Effectiveness Scoring**: Cycle time efficiency, on-time delivery, rework tracking
- **Offline Storage**: All data stored in browser IndexedDB
- **Role-Based Access**: Manager, Web Dev, Mobile Dev, Shopify Dev roles

## Quick Start

### Development
```bash
cd cfe-dashboard
npm install
npm run dev
```
Open http://localhost:5173

### Build for Production
```bash
npm run build
```

### Deploy to GitHub Pages
```bash
# First time only: install gh-pages dependency
npm install

# Build and deploy
npm run deploy
```

## GitHub Pages Deployment

### One-Time Setup

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Install dependencies and deploy:**
   ```bash
   cd cfe-dashboard
   npm install
   npm run deploy
   ```

3. **Enable GitHub Pages:**
   - Go to your repo: `https://github.com/muhammadikhsan23/cfe-dashboard`
   - Click **Settings** → **Pages** (left sidebar)
   - Under **Source**, select **Deploy from a branch**
   - Select branch: **gh-pages**, folder: **/ (root)**
   - Click **Save**
   - Wait 1-2 minutes for deployment

4. **Access your dashboard:**
   - URL: `https://muhammadikhsan23.github.io/cfe-dashboard/`

### Updating After Deploy
Whenever you make changes:
```bash
cd cfe-dashboard
npm run build
npm run deploy
```

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Manager | admin | admin123 |
| Web Dev | web-dev | web123 |
| Mobile Dev | mobile-dev | mobile123 |
| Shopify Dev | shopify-dev | shopify123 |

## Task Size Standards

| Size | Hours | Description |
|------|-------|-------------|
| S | 2-4h | Small tasks |
| M | 4-8h | Medium tasks |
| L | 8-16h | Large tasks |
| XL | 16-32h | Extra large tasks |

## Tech Stack

- Vue.js 3 (Composition API)
- Vite
- PrimeVue (UI Components)
- ECharts (Data Visualization)
- Pinia (State Management)
- IndexedDB (Offline Storage)
- Vue Router

## License

Private - For internal use only