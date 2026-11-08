# Diwali Surprise 2026 — setup guide

## 1) Run the greeting locally
1. Extract this ZIP.
2. Open the `Diwali-Surprise-2026` folder in VS Code.
3. Install the VS Code extension **Live Server**.
4. Right-click `index.html` → **Open with Live Server**.
5. Test name entry, all five diyas, the finale and replay.

The greeting animation works before Firebase is configured. Visitor records will not be saved until Firebase is connected.

## 2) Create the Firebase project
1. Open https://console.firebase.google.com/ and create a project.
2. Add a **Web app** to that project.
3. Copy the Firebase web configuration into `firebase-config.js`, replacing every `PASTE_...` value.
4. In the same file, replace `YOUR_ADMIN_EMAIL@example.com` with the email you will use as the dashboard admin.
5. In Firebase → **Authentication** → Get started → Sign-in method, enable **Email/Password**.
6. In Authentication → Users, add your admin email and set a strong password.
7. In Firebase → **Firestore Database**, create a database.
8. Open Firestore → Rules, paste the contents of `firestore.rules`, and replace `YOUR_ADMIN_EMAIL@example.com` there with the exact same admin email. Publish the rules.

## 3) Check the dashboard
1. Run the site with Live Server.
2. Open `admin.html` using Live Server.
3. Sign in with the admin email/password you created.
4. After visitors use the public greeting, refresh the dashboard to see recorded activity.

## 4) Publish and share
1. Upload all project files to one GitHub repository (keep `index.html` in the root).
2. In GitHub → Settings → Pages, enable deployment from the `main` branch and root folder.
3. Wait for GitHub Pages to publish the site.
4. Share the public `index.html` website link in Instagram Story/DM.
5. Keep the `admin.html` link and admin password private.

## What the dashboard records
- Page view events: a random browser ID, a random visit/session ID and timestamp.
- Named sessions: the name the visitor enters, timestamp, diya progress and completion status.
- Unique browsers are estimated using a random ID stored in that browser's local storage. Clearing browser data or using another browser/device can count as a new unique browser.
- The visitor's Instagram username is not collected and cannot be automatically obtained from a normal shared link.
- The greeting page displays a notice explaining that the entered name and progress may be recorded by the creator.

## Important security notes
- Never publish your Firebase service-account key or admin password. This project uses only the public web-app config.
- The dashboard requires Firebase Authentication and Firestore rules. Do not loosen the read rules.
- This starter setup is intended for a small personal greeting page. Public write endpoints can be spammed; if you later share it widely, add App Check and stricter server-side validation/rate limiting.
- The dashboard currently loads the latest 1,000 page views and 500 named sessions.
