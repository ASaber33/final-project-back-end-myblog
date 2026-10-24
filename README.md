# Omega Blog

Arabic/English blog app with a React frontend and Express REST API backed by PostgreSQL. The frontend is built and served by the same Express service, so the full app can be deployed as one Railway service.

## Project structure

- `server.js` — Express app, API routes, and built frontend
- `frontend/` — React/Vite app; `frontend/public/splash.png` is the centered startup screen artwork
- `user.js` — registration, login, profile, and user administration handlers
- `tables/post.js`, `tables/comment.js`, `tables/reaction.js` — database operations and handlers for the blog tables
- `middleware/auth_middleware.js` — token validation and current-user lookup
- `middleware/role_middleware.js` — role authorization
- `tables/userDb.js` — PostgreSQL pool; `tables/roles.js` — shared role names
- `utils/api.js` — input, ownership, and database error helpers
- `postman/` — Postman collection and local environment

## Local development

Copy `.env.example` to `.env`, then set `DATABASE_URL` and a private `JWT_SECRET`. `.env` is ignored by Git; never commit credentials.

```powershell
npm install
npm ci --prefix frontend
npm run dev
```

Run the frontend dev server in a second terminal:

```powershell
npm run dev --prefix frontend
```

The Vite server proxies API requests to `http://localhost:3100`. To run the production-style single service locally, use `npm run build` then `npm start`; it serves the frontend and API on port `3100`.

## Deploy to Railway

Deploy the repository root as one Railway service. `railway.json` builds the frontend and checks the server, starts Express, and uses `/health` as its health check. Set these variables in Railway:

- `DATABASE_URL` — the actual PostgreSQL connection string. Add a PostgreSQL service in the same Railway project, then reference its generated connection string from the app service (for example, `${{Postgres.DATABASE_URL}}`, replacing `Postgres` with the database service's name). The suggested value `postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require` is only a placeholder and will not connect.
- `JWT_SECRET` — a private random secret (at least 32 characters); replace any suggested `replace_with_...` value.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` — Gmail SMTP settings for password reset email
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` — Twilio settings for password reset SMS

Railway supplies `PORT` automatically. Do not click **Add** on suggested placeholder values without replacing them with real credentials. After setting the database URL and JWT secret, redeploy and confirm `/health` reports `{"status":"ok","database":"connected"}`. Do not upload `.env`, `node_modules`, or `frontend/dist`; Railway installs dependencies and builds the frontend during deployment.

## Password reset delivery

The forgot-password form can send a six-digit code to the account's email or saved phone number. Codes expire after 15 minutes. For SMS, the account phone must include its country code (for example, `+201001234567`).

### Gmail

1. Turn on 2-Step Verification for the Google account that will send the emails.
2. Create an App Password in Google Account security settings. Use this app password, not the normal Gmail password.
3. Add these variables to local `.env` or the Railway service's Variables:

   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your-address@gmail.com
   SMTP_PASS=your-16-character-app-password
   MAIL_FROM=your-address@gmail.com
   ```

### SMS with Twilio

1. Create a Twilio account, obtain an SMS-capable Twilio phone number, and note the Account SID and Auth Token.
2. Configure these variables in local `.env` or Railway. Keep the Auth Token secret:

   ```env
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_FROM_NUMBER=+15551234567
   ```

3. Save the user's phone number, including its country code, in their profile. Trial Twilio accounts may only message verified recipient numbers.

Never commit actual credentials or paste them into source files. In local development, an unconfigured email sender logs the reset code to the API console; in production, email/SMS delivery must be configured to send codes.

## First admin

Public registration always creates a `user`. After registering the intended admin account, promote it in DBeaver:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Log in again after changing the role. The API reads the current role from the database on authenticated requests.

## Permissions

- **user / unauthenticated visitor**: read posts, comments, and reactions. A signed-in user can create posts/comments/reactions and edit/delete only their own posts and comments; they can change or remove their own reaction.
- **admin**: all content access; edit/delete any post or comment; view, edit, or delete any reaction; list/read/delete users and change user roles.
- Admin content management: `GET /admin/posts` and `GET /admin/comments` list content across all authors and statuses. The dashboard offers per-item editing, publishing, draft, trash, restore, and deletion actions.
- `GET /admin/overview` — admin-only totals for users, posts by status, comments, reactions, database size, and latest content activity.
- Passwords are bcrypt hashes stored in the existing `BYTEA` column. API responses never include password hashes.

## Routes

Protected routes require `Authorization: Bearer <token>`.

### Authentication and users

- `POST /register` — `{ "username": "...", "email": "...", "password": "..." }`
- `POST /login` — `{ "email": "...", "password": "..." }`
- `POST /password/forgot` — `{ "channel": "email" | "phone", "destination": "..." }`
- `POST /password/reset` — `{ "channel": "email" | "phone", "destination": "...", "code": "123456", "password": "..." }`
- `GET /profile` — authenticated
- `PATCH /profile` — authenticated; updates `username`, `email`, `avatar_url`, and optional private `age` (13–120) and `phone`
- `GET /users`, `GET /users/:id` — admin
- `PATCH /users/:id/role` — admin; `{ "role": "user" | "admin" }`
- `DELETE /users/:id` — admin; cannot delete the last admin

### Posts

- `GET /posts`, `GET /posts/:id` — public
- `GET /admin/posts` — admin; lists published posts, drafts, and trashed posts for moderation
- `POST /posts` — authenticated; `{ "title": "...", "content": "..." }`
- `PUT /posts/:id`, `PATCH /posts/:id`, `DELETE /posts/:id` — author or admin

### Comments

- `GET /posts/:id/comments` — public
- `POST /posts/:id/comments` — authenticated; `{ "content": "..." }`
- `GET /comments`, `GET /comments/:id` — public
- `GET /admin/comments` — admin; lists comments across all posts for moderation
- `PUT /comments/:id`, `PATCH /comments/:id`, `DELETE /comments/:id` — comment author or admin

### Reactions

- `GET /posts/:id/reactions` — public counts by type
- `PUT /posts/:id/reaction` — authenticated; `{ "type": "like" }` or `{ "type": "dislike" }`
- `DELETE /posts/:id/reaction` — removes the caller's reaction
- `GET /reactions`, `GET /reactions/:id` — public
- `PUT /reactions/:id`, `PATCH /reactions/:id`, `DELETE /reactions/:id` — admin

Reaction writes are serialized per user/post pair so repeated requests update the user's reaction instead of creating another one.
