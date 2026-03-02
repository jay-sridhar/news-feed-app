# Firebase Setup Guide

Connect the NewsFlow app to a real Firebase project for Google Sign-In and cloud sync.

---

## Prerequisites

- A Google account
- The app running locally (`npm run dev`)

---

## Step 1 — Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name it (e.g. `newsflow`) → continue
4. Disable Google Analytics (not needed) → **Create project**

---

## Step 2 — Register a Web App

1. On the project overview page, click the **Web** icon (`</>`)
2. Enter an app nickname (e.g. `newsflow-web`)
3. Leave "Firebase Hosting" unchecked (you're using Vercel)
4. Click **Register app**
5. Copy the `firebaseConfig` object — you'll need these values in Step 5

```js
// Example — your values will differ
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "newsflow-abc12.firebaseapp.com",
  projectId: "newsflow-abc12",
  storageBucket: "newsflow-abc12.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

6. Click **Continue to console**

---

## Step 3 — Enable Google Sign-In

1. In the left sidebar → **Authentication** → **Get started**
2. Click the **Sign-in method** tab
3. Click **Google** → toggle **Enable** → set a support email → **Save**

---

## Step 4 — Create a Firestore Database

1. In the left sidebar → **Firestore Database** → **Create database**
2. Choose **Start in production mode** (you'll add rules in the next step)
3. Select a region close to your users (e.g. `us-central` or `europe-west`)
4. Click **Enable**

### Add Security Rules

In Firestore → **Rules** tab, replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish**.

This ensures each user can only read and write their own data.

---

## Step 5 — Configure Environment Variables

Copy `.env.example` to `.env` at the project root:

```bash
cp .env.example .env
```

Fill in the values from the `firebaseConfig` object you copied in Step 2:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=newsflow-abc12.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=newsflow-abc12
VITE_FIREBASE_STORAGE_BUCKET=newsflow-abc12.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

`.env` is gitignored — never commit it.

---

## Step 6 — Add Authorized Domains

Firebase restricts which domains can trigger Google Sign-In.

1. In Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. `localhost` is already there (for local dev)
3. After deploying to Vercel, add your Vercel domain (e.g. `newsflow.vercel.app`)

---

## Step 7 — Test Locally

```bash
npm run dev
```

1. Open `http://localhost:5173`
2. Tap the gear icon → **Settings**
3. Tap **Sign in with Google** → complete the Google OAuth popup
4. Settings should now show your name and profile photo
5. Bookmark a few articles — open DevTools → Application → Firestore (or check Firebase Console → Firestore → Data) to verify the writes

---

## Step 8 — Deploy to Vercel

Add the environment variables to your Vercel project:

1. Go to your project on [vercel.com](https://vercel.com) → **Settings** → **Environment Variables**
2. Add each of the six `VITE_FIREBASE_*` variables with their production values
3. Redeploy (push to `main` or trigger manually)

Then add your Vercel domain to Firebase Authorized Domains (Step 6).

---

## Free Tier Limits (Spark Plan)

You don't need a billing account. The Spark plan covers this app comfortably:

| Resource | Free limit | Expected usage |
|----------|-----------|----------------|
| Auth MAU | 10,000 / month | Personal app |
| Firestore reads | 50,000 / day | ~1 per sign-in + live listener |
| Firestore writes | 20,000 / day | 1 per bookmark / pref change |
| Firestore storage | 1 GB | ~1 KB per bookmark |

---

## Troubleshooting

**"This domain is not authorized"** — Add your domain to Firebase → Authentication → Settings → Authorized domains.

**Popup blocked** — Browser blocked the sign-in popup. Allow popups for `localhost` / your domain, or try again (some browsers block the first attempt).

**Sign-in button does nothing** — Check the browser console. If you see `[NewsFlow] Firebase env vars missing`, your `.env` file is missing or a variable is empty.

**Firestore permission denied** — Your security rules may not be published yet. Go to Firestore → Rules and click **Publish**.

**Works locally but not on Vercel** — Verify environment variables are set in Vercel project settings and the deployment was triggered after adding them.
