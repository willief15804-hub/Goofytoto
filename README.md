# Ultimate Frisbee Club Tracker

A web app for managing an Ultimate Frisbee club — track attendance, skill tests, player profiles, and a 20-week training calendar.

## Features

- **Dashboard** — Overview stats, attendance trends, team skill radar chart, top performers, current week summary
- **Attendance** — Log practices with date/type/notes, toggle player attendance, per-player attendance rates
- **Skill Tests** — Record skill scores (Throwing, Catching, Cutting, Marking, Handler, Fitness) on a 1-10 scale, compare players with radar overlays
- **Players** — Player cards with stats, filter by position, add/edit players
- **Player Profiles** — Individual radar charts, skill progress line charts over time, attendance history
- **20-Week Calendar** — Season training plan with weekly focus areas, drills, and notes; edit any week inline

## Tech Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** for styling
- **Recharts** for charts (radar, bar, line)
- **localStorage** for data persistence (no backend needed)
- Pre-loaded with **sample data** (10 players, 12 practices, 20 skill tests, 20-week calendar)

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed

### Install and Run

```bash
cd ultimate-frisbee-tracker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
  app/
    page.tsx              # Dashboard
    attendance/page.tsx   # Practice attendance tracking
    skills/page.tsx       # Skill test tracking
    players/page.tsx      # Player list
    players/[id]/page.tsx # Individual player profile
    calendar/page.tsx     # 20-week training calendar
    layout.tsx            # Root layout with navbar
    globals.css           # Global styles
  components/
    Navbar.tsx            # Navigation bar
  hooks/
    useLocalStorage.ts    # Data initialization hook
  lib/
    types.ts              # TypeScript interfaces
    store.ts              # localStorage CRUD helpers
    sample-data.ts        # Seed data (10 players, practices, skill tests, calendar)
```

## Data Management

All data is stored in the browser's localStorage. Click **Reset Data** on the dashboard to restore the original sample data.
