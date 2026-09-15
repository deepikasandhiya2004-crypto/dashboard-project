# Dashboard Project

A React (Vite) admin dashboard — sidebar, header, stat cards, a chart, and a data
table — backed by a small Express + PostgreSQL API for Projects and Tasks.

```
dashboard-project/
├── src/
│   ├── components/   Sidebar, Header, StatCard, ChartCard, DataTable
│   ├── pages/        Dashboard, Projects, Tasks, Marketing, Calendar,
│   │                 Finance, Support, Reports, Settings
│   ├── layouts/       DashboardLayout (sidebar + header shell)
│   ├── lib/api.js     fetch helper that talks to the backend
│   ├── App.jsx, main.jsx, index.css
├── public/
├── server/            Express + Prisma + PostgreSQL API (separate app)
├── package.json
└── vite.config.js
```

**Wired to the real database:** Dashboard, Projects, Tasks.
**UI scaffolds with sample data** (same look, no database yet): Marketing, Calendar,
Finance, Support, Reports, Settings. Each file has a comment showing where to plug
in a real API call once you know what those pages need to track.

---

## 1. Get PostgreSQL running

Same as before — easiest path for two people working together is a free hosted
database so you're both pointed at the same data:

1. Go to [neon.tech](https://neon.tech), sign up, create a project.
2. Copy the connection string it gives you (starts with `postgresql://...`).
3. You'll paste it into `server/.env` in step 3 below.

(If you'd rather run Postgres locally, see the note at the bottom.)

## 2. Run the backend (the API + database layer)

```bash
cd server
npm install
cp .env.example .env
# paste your real Neon connection string into DATABASE_URL in .env

npx prisma migrate dev --name init   # creates the Project and Task tables
npm run dev
```

You should see `API server running on http://localhost:4000`. Leave this terminal
running.

## 3. Run the frontend

Open a **second** terminal:

```bash
cd dashboard-project        # the folder with package.json, index.html, src/
npm install
cp .env.example .env        # already points at http://localhost:4000, no edit needed
npm run dev
```

Open the URL it prints (usually http://localhost:5173). You should see the
dashboard, and Projects/Tasks should load from your database (they'll be empty
until you add some through the UI).

Both terminals need to stay running while you work — the frontend calls the
backend, and the backend calls the database.

---

## 4. Adding the Gellix font

Drop your licensed files into `public/fonts/` — see the filenames listed in
`public/fonts/PUT_GELLIX_FONT_FILES_HERE.txt`. Until then the site just falls
back to the system font.

---

## 5. Git — pushing this to your shared repo

```bash
git add .
git commit -m "Add dashboard app with sidebar, pages, and Postgres-backed API"
git push origin main
```

If your friend already has commits in the repo, run `git pull origin main` first,
resolve any conflicts, then push. From here on:

- Work in a feature branch (`git checkout -b your-name/some-feature`), push it,
  and open a Pull Request into `main` rather than both pushing to `main` directly.
- Never commit `.env` (it's already git-ignored) — only `.env.example` should be
  in the repo, since real `.env` files hold your actual database connection string.
- Whoever changes `server/prisma/schema.prisma` should run
  `npx prisma migrate dev --name describe-the-change` and commit the new folder
  that appears under `server/prisma/migrations/`. The other person just runs
  `npx prisma migrate dev` after pulling to apply it locally.

---

## 6. Deploying it for real

- **Frontend:** [vercel.com](https://vercel.com) or [netlify.com](https://netlify.com) —
  both auto-detect Vite, just import the GitHub repo and set the root directory to
  the repo root (or wherever `package.json` for the frontend lives). Set the
  `VITE_API_URL` environment variable to your deployed backend's URL.
- **Backend:** [render.com](https://render.com) or [railway.app](https://railway.app) —
  import the repo, set the root directory to `server`, set `DATABASE_URL` to your
  Neon connection string, and set the start command to `npm start`.

---

## Using a local PostgreSQL instead of Neon

```bash
# Mac
brew install postgresql@16 && brew services start postgresql@16
# then:
psql postgres
CREATE DATABASE dashboard;
\q
```

Then in `server/.env`:
```
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/dashboard"
```

This only exists on your machine, though — your friend would need her own local
setup with the same steps, and it won't work once you deploy. Neon (section 1)
avoids both problems.
