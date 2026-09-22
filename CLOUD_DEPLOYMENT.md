# Deploying Sahayak AI Online (Free 24/7 Access on Mobile)

Follow either of these two methods to access your app from your phone anywhere, anytime (even when your laptop is turned off):

---

## METHOD 1: Free 1-Click Cloud Deployment via Render (Recommended)

Render provides free 24/7 cloud hosting with automated HTTPS.

### Step 1: Upload Project to GitHub
1. Open [github.com](https://github.com) and create a free account if you don't have one.
2. Click **New Repository** and name it `SahayakAI`.
3. You can upload the files directly via GitHub website or using GitHub Desktop.

### Step 2: Deploy on Render
1. Go to [dashboard.render.com](https://dashboard.render.com/) and sign in with GitHub.
2. Click **New +** ➔ **Web Service**.
3. Select your `SahayakAI` repository.
4. Settings:
   - **Name**: `sahayak-ai`
   - **Region**: Singapore (or nearest to you)
   - **Environment**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt "pydantic[email]"`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free
5. Click **Create Web Service**.

Render will deploy the app and provide a live public HTTPS address (e.g., `https://sahayak-ai.onrender.com`).

---

## METHOD 2: Free 1-Click Cloud Deployment via Koyeb (Alternative)

1. Sign up for free at [koyeb.com](https://www.koyeb.com/).
2. Click **Create App** ➔ **GitHub**.
3. Select your repository.
4. Koyeb automatically detects the included `Dockerfile` and deploys it worldwide for free.

---

## How to Install the App on Your Phone Once Live:

1. Open your live HTTPS link (e.g. `https://sahayak-ai.onrender.com`) on your mobile phone browser (Chrome or Safari).
2. Tap the browser menu `⋮` (Android) or `⎋` (iOS).
3. Tap **"Install app"** or **"Add to Home Screen"**.
4. The Sahayak AI icon is now installed as an app on your mobile phone and works 24/7 anywhere in the world!
