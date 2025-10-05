#!/bin/bash

# University Attendance Management System Setup Script
echo "Setting up University Attendance Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm first."
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install all required dependencies
echo "Installing dependencies..."
npm install

# Install shadcn/ui
echo "Setting up shadcn/ui..."
npx shadcn-ui@latest init --yes

# Install additional shadcn components
echo "Installing shadcn components..."
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add select
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add form
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add command

# Create .env.local file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cp env.example .env.local
    echo "Please update .env.local with your Supabase credentials"
fi

echo "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Set up your Supabase project"
echo "2. Update .env.local with your Supabase credentials"
echo "3. Run the database schema in your Supabase SQL editor"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "For detailed setup instructions, see README.md"
