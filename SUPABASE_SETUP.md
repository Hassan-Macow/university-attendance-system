# 🚀 Supabase Setup Guide

## 📋 **Prerequisites**
- Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js 18+ installed
- Git repository cloned

## 🔧 **Step 1: Create Supabase Project**

1. **Go to [Supabase Dashboard](https://app.supabase.com)**
2. **Click "New Project"**
3. **Fill in project details:**
   - Organization: Select or create one
   - Project Name: `university-attendance-system`
   - Database Password: Choose a strong password
   - Region: Select closest to your users
4. **Click "Create new project"**
5. **Wait for project to be ready** (2-3 minutes)

## 🔑 **Step 2: Get Your Credentials**

1. **Go to Project Settings** (gear icon in sidebar)
2. **Click "API" tab**
3. **Copy these values:**
   - **Project URL** (starts with `https://`)
   - **Anon/Public Key** (starts with `eyJ`)

## ⚙️ **Step 3: Configure Environment Variables**

1. **Open `.env.local` file** in your project root
2. **Replace the placeholder values:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret for custom authentication
JWT_SECRET=your_secure_random_string_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🗄️ **Step 4: Set Up Database Schema**

1. **Go to SQL Editor** in Supabase Dashboard
2. **Click "New Query"**
3. **Copy the entire schema** from `src/lib/supabase.ts` (lines 19-160)
4. **Paste and run the SQL** to create all tables

## 🔐 **Step 5: Configure Authentication (Optional)**

If you want to use Supabase Auth instead of custom authentication:

1. **Go to Authentication > Settings**
2. **Configure your preferred auth providers**
3. **Set up email templates**
4. **Configure redirect URLs**

## 🧪 **Step 6: Test Connection**

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Check browser console** for any Supabase connection errors
3. **Test database operations** in your app

## 📊 **Step 7: Insert Sample Data (Optional)**

You can add sample data to test your application:

```sql
-- Insert sample campus
INSERT INTO campuses (name, latitude, longitude, allowed_radius) 
VALUES ('Main Campus', 12.3456, 78.9012, 100);

-- Insert sample department
INSERT INTO departments (name, campus_id) 
VALUES ('Computer Science', (SELECT id FROM campuses LIMIT 1));

-- Insert sample user
INSERT INTO users (name, email, password_hash, role, campus_id, department_id) 
VALUES ('Admin User', 'admin@university.edu', '$2b$10$...', 'superadmin', 
        (SELECT id FROM campuses LIMIT 1), 
        (SELECT id FROM departments LIMIT 1));
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Missing Supabase environment variables"**
   - Check `.env.local` file exists
   - Verify variable names are correct
   - Restart development server

2. **"Invalid API key"**
   - Double-check your Supabase URL and key
   - Ensure no extra spaces or quotes

3. **"Database connection failed"**
   - Check if your Supabase project is active
   - Verify database password is correct

4. **"Table doesn't exist"**
   - Run the database schema SQL in Supabase SQL Editor
   - Check for any SQL errors

## 🎯 **Next Steps**

Once connected:
- ✅ Test user authentication
- ✅ Create sample data
- ✅ Test attendance tracking
- ✅ Configure GPS location settings
- ✅ Set up real-time subscriptions

## 📞 **Need Help?**

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)