#!/bin/bash

# Booking CRM - Logging Setup Script
echo "🚀 Setting up logging system for Booking CRM..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory
echo -e "${BLUE}📁 Creating logs directory...${NC}"
mkdir -p logs
chmod 755 logs

# Create monitoring directory if it doesn't exist
echo -e "${BLUE}📊 Setting up monitoring directory...${NC}"
mkdir -p monitoring

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing PM2 globally...${NC}"
    npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 is already installed${NC}"
fi

# Build the project
echo -e "${BLUE}🔨 Building TypeScript project...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed. Please fix TypeScript errors first.${NC}"
    exit 1
fi

# Start application with PM2
echo -e "${BLUE}🚀 Starting application with PM2...${NC}"
pm2 start ecosystem.config.js

# Wait for app to start
sleep 3

# Check if app is running
pm2_status=$(pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null)

if [ "$pm2_status" = "online" ]; then
    echo -e "${GREEN}✅ Application started successfully${NC}"
else
    echo -e "${RED}❌ Application failed to start. Check PM2 logs:${NC}"
    echo -e "${YELLOW}   pm2 logs booking-backend${NC}"
    exit 1
fi

# Set up log rotation for PM2
echo -e "${BLUE}📋 Installing PM2 log rotation module...${NC}"
pm2 install pm2-logrotate

# Configure PM2 log rotation
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# Make scripts executable
echo -e "${BLUE}🔧 Making scripts executable...${NC}"
chmod +x scripts/log-analyzer.js

# Test logging system
echo -e "${BLUE}🧪 Testing logging system...${NC}"

# Make a test request to generate logs
test_url="http://localhost:3500/api/public/calendar?date=$(date +%Y-%m-%d)"
echo -e "${YELLOW}📡 Making test request to: $test_url${NC}"

# Test request (this might fail if calendar endpoint needs specific data, but will generate logs)
curl -X POST "$test_url" \
     -H "Content-Type: application/json" \
     -H "domain: test-domain.com" \
     -d '[{"serviceId": 1, "employeeIds": [1]}]' \
     --silent --show-error || echo -e "${YELLOW}⚠️  Test request failed (expected for demo), but logs should be generated${NC}"

sleep 2

# Check if logs are being created
current_date=$(date +%Y-%m-%d)
combined_log="logs/combined-$current_date.log"

if [ -f "$combined_log" ]; then
    echo -e "${GREEN}✅ Logs are being created successfully${NC}"
    echo -e "${BLUE}📄 Recent log entries:${NC}"
    tail -n 3 "$combined_log" | head -n 3
else
    echo -e "${YELLOW}⚠️  No logs found yet. This might be normal if no requests have been made.${NC}"
fi

# Display useful commands
echo -e "\n${GREEN}🎉 Logging system setup completed!${NC}"
echo -e "\n${BLUE}📚 Useful commands:${NC}"
echo -e "${YELLOW}  # View application logs${NC}"
echo -e "  pm2 logs booking-backend"
echo -e "\n${YELLOW}  # View real-time combined logs${NC}"
echo -e "  tail -f logs/combined-$(date +%Y-%m-%d).log"
echo -e "\n${YELLOW}  # View only errors${NC}"
echo -e "  tail -f logs/error-$(date +%Y-%m-%d).log"
echo -e "\n${YELLOW}  # Analyze today's logs${NC}"
echo -e "  node scripts/log-analyzer.js analyze"
echo -e "\n${YELLOW}  # Monitor logs in real-time${NC}"
echo -e "  node scripts/log-analyzer.js monitor"
echo -e "\n${YELLOW}  # Open error dashboard${NC}"
echo -e "  open monitoring/error-dashboard.html"
echo -e "\n${YELLOW}  # PM2 monitoring${NC}"
echo -e "  pm2 monit"
echo -e "\n${YELLOW}  # Restart application${NC}"
echo -e "  pm2 restart booking-backend"

# Show current status
echo -e "\n${BLUE}📊 Current Status:${NC}"
pm2 status

# Show log files
echo -e "\n${BLUE}📁 Log Files:${NC}"
ls -la logs/ 2>/dev/null || echo -e "${YELLOW}  No log files yet${NC}"

echo -e "\n${GREEN}🚨 Your error monitoring system is now active!${NC}"
echo -e "${BLUE}📖 Read LOGGING_GUIDE.md for detailed usage instructions.${NC}"
