# TCS Tumzy Couture and Styles

Full-stack MERN website: fashion portfolio + no-login customer request system,
with a JWT-protected admin dashboard.

## Structure

```
backend/   Node + Express + MongoDB/Mongoose API
frontend/  React (Vite) + Tailwind CSS v4
```

Each has its own `package.json` — install and run them separately.

## 1. Backend setup

```
cd backend
npm install
cp .env.example .env
```

Fill in `.env`:
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — from your Cloudinary dashboard
- `CLIENT_URL` — your frontend URL (`http://localhost:5173` for local dev)
- `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — used once to create your admin login

Create your admin account, then start the server:

```
npm run seed:admin
npm run dev
```

API runs on `http://localhost:5000`. Health check: `GET /api/health`.

## 2. Frontend setup

```
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api` requests to the backend
(see `vite.config.js`). For a production build, set `VITE_API_BASE_URL` to
your deployed backend's URL before running `npm run build`.

## 3. First-time content

The site has no seed data — as soon as the backend is running:

1. Log in at `/admin/login` with the admin credentials you seeded.
2. Add a few categories under **Categories**.
3. Add designs under **Designs → + Add New Design** (main image required,
   up to 5 additional images).
4. Mark designs **Featured** to have them appear on the homepage.

Once designs exist, the public site (`/`, `/collections`, `/design/:slug`)
is fully live — visitors can browse and submit requests with no account.

## 4. Deploying

Both folders are set up for Vercel (`vercel.json` in `backend/`):
- `server.js` guards `app.listen()` so it works as a serverless function.
- Deploy `backend/` and `frontend/` as two separate Vercel projects.
- Set the backend's env vars in the Vercel dashboard (not in code).
- Set the frontend's `VITE_API_BASE_URL` to the deployed backend URL.
- Set the backend's `CLIENT_URL` to the deployed frontend URL (for CORS).

## Notes on what's included vs. left as extension points

- Email notifications on new requests: the request flow is structured to add
  this easily (see the `createRequest` controller) but Nodemailer isn't wired
  in yet.
- SEO meta tags are set for the homepage; per-design `<title>`/meta tags
  would need `react-helmet-async` or similar if you want them per-page.
- Admin accounts are created only via the seed script — there's no
  "add another admin" UI, since the spec only called for a single admin login.
