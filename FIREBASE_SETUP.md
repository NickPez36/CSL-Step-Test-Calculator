# Firebase setup for two-role login

1. **Authentication**
   - In [Firebase Console](https://console.firebase.google.com/) → Authentication → Sign-in method → enable **Email/Password**.

2. **Create two users**
   - Add a user with email **exactly** matching `VITE_AUTH_VIEWER_EMAIL` (e.g. `viewer@csl-step.local`) and password `PhysiologyChicken4321!` (or your chosen password).
   - Add a user with email **exactly** matching `VITE_AUTH_ADMIN_EMAIL` (e.g. `admin@csl-step.local`) and password `KnowThyEnemy4321!` (or your chosen password).

3. **Environment**
   - Copy `react-app/.env.example` to `react-app/.env.local` and set all `VITE_FIREBASE_*` values. Auth emails default to `viewer@csl-step.local` and `admin@csl-step.local`; only set `VITE_AUTH_VIEWER_EMAIL` / `VITE_AUTH_ADMIN_EMAIL` if you use different addresses (and update [firestore.rules](firestore.rules) to match).

4. **Firestore rules**
   - Defaults in [firestore.rules](firestore.rules) use `viewer@csl-step.local` and `admin@csl-step.local`. If you override emails in `.env.local`, edit the rules to use the **same** addresses.
   - Deploy: `firebase deploy --only firestore:rules`

5. **First-time data**
   - Existing documents in `saved_test_sessions` are admin-only. After an admin signs in, the app runs a one-time migration to build `saved_test_sessions_viewer` and `athlete_registry` entries.

**Security:** Do not commit `.env.local` or real passwords. Rotate passwords in Firebase Console if they were shared in plain text.
