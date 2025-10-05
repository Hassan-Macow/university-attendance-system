# University Attendance Management System Setup Script
Write-Host "Setting up University Attendance Management System..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install all required dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Install shadcn/ui
Write-Host "Setting up shadcn/ui..." -ForegroundColor Yellow
npx shadcn-ui@latest init --yes

# Install additional shadcn components
Write-Host "Installing shadcn components..." -ForegroundColor Yellow
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
if (!(Test-Path ".env.local")) {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env.local"
    Write-Host "Please update .env.local with your Supabase credentials" -ForegroundColor Cyan
}

Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up your Supabase project" -ForegroundColor White
Write-Host "2. Update .env.local with your Supabase credentials" -ForegroundColor White
Write-Host "3. Run the database schema in your Supabase SQL editor" -ForegroundColor White
Write-Host "4. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host ""
Write-Host "For detailed setup instructions, see README.md" -ForegroundColor Cyan
