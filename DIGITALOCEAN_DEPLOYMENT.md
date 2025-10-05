# 🚀 DigitalOcean Deployment Guide

This guide will help you deploy the University Attendance Management System to DigitalOcean.

## 📋 Prerequisites

- DigitalOcean account
- Domain name (optional)
- Basic knowledge of Docker and Linux

## 🎯 Deployment Options

### Option 1: DigitalOcean App Platform (Recommended)

#### Step 1: Prepare Your Repository
1. Ensure all files are committed and pushed to GitHub
2. Your repository should be public or connected to DigitalOcean

#### Step 2: Create App on DigitalOcean
1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose "GitHub" as source
4. Select your repository: `sidowxyz/university-attendance-system`
5. Choose branch: `main`

#### Step 3: Configure App Settings
1. **App Name**: `university-attendance-system`
2. **Region**: Choose closest to your users
3. **Plan**: Basic ($5/month) or Professional
4. **Build Command**: `npm run build`
5. **Run Command**: `npm start`
6. **Port**: `3000`

#### Step 4: Environment Variables
Add these environment variables in the App Platform:
```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_UNIVERSITY_NAME=Zamzam University
NEXT_PUBLIC_UNIVERSITY_FULL_NAME=Zamzam University of Science and Technology
```

#### Step 5: Deploy
1. Click "Create Resources"
2. Wait for deployment to complete
3. Your app will be available at: `https://your-app-name.ondigitalocean.app`

### Option 2: DigitalOcean Droplet (VPS)

#### Step 1: Create Droplet
1. Go to [DigitalOcean Droplets](https://cloud.digitalocean.com/droplets)
2. Click "Create Droplet"
3. Choose Ubuntu 22.04 LTS
4. Select Basic plan ($6/month minimum)
5. Add SSH key for security
6. Choose datacenter region

#### Step 2: Connect to Droplet
```bash
ssh root@your-droplet-ip
```

#### Step 3: Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
apt install git -y
```

#### Step 4: Clone and Deploy
```bash
# Clone repository
git clone https://github.com/sidowxyz/university-attendance-system.git
cd university-attendance-system

# Create production environment file
cp env.production.example .env.production
nano .env.production  # Edit with your production values

# Build and run with Docker
docker-compose up -d --build
```

#### Step 5: Configure Firewall
```bash
# Allow HTTP and HTTPS
ufw allow 80
ufw allow 443
ufw allow 3000
ufw enable
```

#### Step 6: Set up Domain (Optional)
1. Point your domain to the droplet IP
2. Install Nginx for reverse proxy:
```bash
apt install nginx -y

# Create Nginx config
cat > /etc/nginx/sites-available/university-attendance << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/university-attendance /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 🔧 Post-Deployment Configuration

### 1. Database Setup
- Set up a production database (PostgreSQL recommended)
- Update environment variables with database connection string
- Run database migrations

### 2. Authentication Setup
- Configure production authentication keys
- Set up proper session management
- Enable HTTPS for security

### 3. Monitoring
- Set up monitoring and logging
- Configure alerts for downtime
- Monitor resource usage

### 4. Backup Strategy
- Set up automated backups
- Test restore procedures
- Document recovery processes

## 🚨 Troubleshooting

### Common Issues:
1. **Port not accessible**: Check firewall settings
2. **Build fails**: Check Node.js version and dependencies
3. **Database connection**: Verify connection string and credentials
4. **Memory issues**: Increase droplet size or optimize app

### Useful Commands:
```bash
# Check app status
docker-compose ps

# View logs
docker-compose logs -f

# Restart app
docker-compose restart

# Update app
git pull
docker-compose up -d --build
```

## 💰 Cost Estimation

### App Platform:
- Basic Plan: $5/month
- Professional Plan: $12/month

### Droplet:
- Basic Droplet: $6/month
- With domain and SSL: ~$8-10/month

## 🎉 Success!

Your University Attendance Management System should now be running on DigitalOcean!

**Access your app at:**
- App Platform: `https://your-app-name.ondigitalocean.app`
- Droplet: `http://your-droplet-ip:3000` or `https://your-domain.com`

## 📞 Support

If you encounter any issues:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Check DigitalOcean documentation
4. Review this deployment guide

**Happy Deploying! 🚀**
