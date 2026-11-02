# Battleground Map Preview

The first page uses **Sign in with Google**. The first successful sign-in creates a user document in MongoDB; later sign-ins return to that account. The app stores the Google account ID, verified email, username, and creation time. It does not store a Google password.

## MongoDB Atlas setup

1. Create a MongoDB Atlas cluster and a database user.
2. Copy the connection string from **Connect / Drivers**.
3. In Atlas **Network Access**, allow connections from your Vercel deployment according to your Vercel plan and Atlas setup.
4. Set `MONGODB_URI` and `MONGODB_DB` in Vercel. Use `battleground` for the database name.

On the first API request, the app creates the `users` collection and unique indexes for email and Google account ID. No SQL import or phpMyAdmin is needed. View registered users in Atlas **Data Explorer / battleground / users**.

## Google sign-in setup

1. In Google Cloud Console, create an OAuth client ID with application type **Web application**.
2. Add your exact Vercel site origin under **Authorized JavaScript origins**, such as `https://your-project.vercel.app`. Add your custom domain too if you use one.
3. Set the OAuth consent screen branding and publishing status in the Google Auth Platform.
4. Add the client ID to Vercel as `GOOGLE_CLIENT_ID`.

## Vercel environment variables

- `MONGODB_URI`
- `MONGODB_DB` (for example, `battleground`)
- `GOOGLE_CLIENT_ID` (the Web application client ID; no client secret is used by this sign-in flow)
- `SESSION_SECRET` (random secret, at least 32 characters)

After changing environment variables, redeploy. Never put database credentials or the session secret in `index.html` or commit real values to GitHub. For local development, copy `.env.example` to `.env.local`, fill in your Atlas and Google values, install dependencies with `npm install`, then run `npx vercel dev`. Add `http://localhost:3000` as an authorized JavaScript origin for local sign-in.
