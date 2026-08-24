# 🚀 RatingPulse.co - Vercel Production Deployment Guide

This guide walks you through deploying **RatingPulse.co** to Vercel with custom domain setup, Supabase authentication, and live Stripe subscriptions.

---

## 📋 Prerequisites Checklist
Before deploying, make sure you have:
1. A **[Vercel Account](https://vercel.com/signup)** (Free / Pro).
2. A **[GitHub Account](https://github.com/)** or Vercel CLI installed locally.
3. Your **Supabase Project** URL & API keys (from [Supabase Dashboard](https://app.supabase.com)).
4. Your **Stripe Account** API keys (from [Stripe Dashboard](https://dashboard.stripe.com)).

---

## Method 1: Deploy via GitHub & Vercel Dashboard (Recommended)

### Step 1: Push Code to GitHub
```bash
# Initialize git in the project root
git init
git add .
git commit -m "feat: RatingPulse.co production release"

# Create repository on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/ratingpulse.git
git branch -M main
git push -u origin main
```

### Step 2: Import Project to Vercel
1. Go to **[vercel.com/new](https://vercel.com/new)**.
2. Select your `ratingpulse` GitHub repository and click **Import**.
3. **Framework Preset**: Vercel will automatically detect `Next.js`.
4. **Root Directory**: `./` (leave default).

### Step 3: Add Environment Variables in Vercel
Expand the **Environment Variables** section in the Vercel deployment modal and paste the following:

| Variable Name | Description / Source | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Your production site URL | `https://ratingpulse.co` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings $\rightarrow$ API | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings $\rightarrow$ API | `eyJhbGciOiJI...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings $\rightarrow$ API | `eyJhbGciOiJI...` |
| `STRIPE_SECRET_KEY` | Stripe Dashboard $\rightarrow$ Developers $\rightarrow$ API Keys | `sk_live_...` or `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard $\rightarrow$ Developers $\rightarrow$ API Keys | `pk_live_...` or `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard $\rightarrow$ Webhooks | `whsec_...` |
| `GEMINI_API_KEY` | Google AI Studio ([aistudio.google.com](https://aistudio.google.com/)) | `AIzaSy...` |
| `GOOGLE_PLACES_API_KEY` | Google Cloud Console $\rightarrow$ Credentials | `AIzaSy...` |

### Step 4: Deploy
Click **Deploy**. Vercel will build and deploy the Next.js App Router application in under 60 seconds!

---

## Method 2: Deploy via Vercel CLI

You can also deploy directly from your local terminal:

```bash
# 1. Install or run Vercel CLI
npx vercel

# 2. Follow prompts to link your project
# ? Set up and deploy? [Y/n] y
# ? Which scope do you want to deploy to? [Your Name]
# ? Link to existing project? [y/N] n
# ? What's your project's name? ratingpulse
# ? In which directory is your code located? ./

# 3. Add production environment variables
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add STRIPE_SECRET_KEY

# 4. Deploy to Production
npx vercel --prod
```

---

## ⚙️ Post-Deployment Configuration

### 1. Configure Supabase Authentication Redirects
1. Go to **Supabase Dashboard** $\rightarrow$ **Authentication** $\rightarrow$ **URL Configuration**.
2. **Site URL**: Set to `https://ratingpulse.co` (or your `*.vercel.app` domain).
3. **Redirect URLs**: Add:
   - `https://ratingpulse.co/auth/callback`
   - `https://ratingpulse.co/dashboard`
   - `https://*.vercel.app/auth/callback`

### 2. Configure Stripe Webhooks
1. Go to **Stripe Dashboard** $\rightarrow$ **Developers** $\rightarrow$ **Webhooks**.
2. Click **Add Endpoint**.
3. **Endpoint URL**: `https://ratingpulse.co/api/stripe/webhook`
4. **Events to listen for**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing Secret** (`whsec_...`) and add it as `STRIPE_WEBHOOK_SECRET` in Vercel.

### 3. Add Custom Domain (`ratingpulse.co`)
1. In Vercel Project Settings $\rightarrow$ **Domains**.
2. Enter `ratingpulse.co` and `www.ratingpulse.co`.
3. Configure your DNS provider (e.g. Cloudflare, Namecheap, GoDaddy):
   - **A Record**: `@` $\rightarrow$ `76.76.21.21`
   - **CNAME Record**: `www` $\rightarrow$ `cname.vercel-dns.com`
4. Vercel automatically provisions and renews SSL certificates (HTTPS) for free.

---

## 🛠️ Verification Commands

```bash
# Verify local production build
npm run build

# Start production server locally to test
npm run start
```
