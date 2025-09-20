#!/bin/bash

# Script to deploy PDF generation fix to production
echo "🚀 Deploying PDF generation fix..."

# Install new dependencies
echo "📦 Installing new dependencies..."
npm install puppeteer-core@^24.1.1 @sparticuz/chromium@^131.0.0

# Build the project
echo "🔨 Building project..."
npm run build

# Restart the application (assuming PM2 is used)
echo "🔄 Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "✅ Application restarted with PM2"
else
    echo "⚠️  PM2 not found. Please restart your application manually."
fi

echo "✅ PDF generation fix deployed successfully!"
echo "📝 Changes made:"
echo "   - Updated Puppeteer configuration to work without system Chrome"
echo "   - Added @sparticuz/chromium for production environments"
echo "   - Added proper browser cleanup to prevent memory leaks"
echo ""
echo "🧪 Test the PDF generation endpoint to verify the fix works."
