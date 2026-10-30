# Battleground Map Preview

The first page is a login form. Registration and login use MongoDB Atlas through the Vercel Node.js API. Passwords are stored as bcrypt hashes.

## MongoDB Atlas setup

1. Create a MongoDB Atlas cluster.
2. Create a database user and copy the connection string from **Connect / Drivers**.
3. In Atlas **Network Access**, allow connections from your Vercel deployment according to your Vercel plan and Atlas setup.
4. Add the connection string to the Vercel environment variable `MONGODB_URI` and set `MONGODB_DB` to `battleground`.
5. Add `SESSION_SECRET` with a random value of at least 32 characters.
6. Deploy the repository. On the first API request, the app creates the `users` collection and a unique index for email. No SQL import or phpMyAdmin is needed.

The `users` documents contain `username`, `email`, `passwordHash`, and `createdAt`. View registered accounts in the Atlas **Data Explorer**. Do not put the MongoDB connection string or session secret in `index.html` or commit real values to GitHub.

## Vercel environment variables

- `MONGODB_URI`
- `MONGODB_DB` (for example, `battleground`)
- `SESSION_SECRET` (random secret, at least 32 characters)

For local development, copy `.env.example` to `.env.local`, fill in your Atlas values, install dependencies with `npm install`, then run `npx vercel dev`.
