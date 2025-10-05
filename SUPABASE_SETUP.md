# Supabase Setup Guide

## Quick Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `attendance-management-system`
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest to your location
6. Click "Create new project"

### 2. Get Your Credentials
1. Once your project is created, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 3. Update Environment Variables
1. Open `.env.local` file in your project root
2. Replace the placeholder values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here

# JWT Secret for custom authentication
JWT_SECRET=your_secure_random_string_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

### 4. Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire content from `src/lib/supabase.ts` (the `databaseSchema` constant)
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

### 5. Restart Development Server
1. Stop the current server (Ctrl+C in terminal)
2. Run `npm run dev` again
3. Open http://localhost:3003 in your browser

## Demo Data (Optional)
After setting up the database, you can add some demo data using the demo data from `src/lib/demo-data.ts` or start fresh.

## Troubleshooting
- Make sure your Supabase project is fully created before copying credentials
- Ensure the database schema ran without errors
- Check that all environment variables are correctly set
- Restart the development server after making changes to `.env.local`

## Next Steps
Once Supabase is configured:
1. Login with demo credentials
2. Create your first campus
3. Set up departments and batches
4. Add lecturers and students
5. Start taking attendance!
