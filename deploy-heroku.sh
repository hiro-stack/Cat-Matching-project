#!/bin/bash
# Heroku Deployment Script for Cat Matching API

set -e  # Exit on error

echo "🚀 Starting Heroku deployment..."

# Check if APP_NAME is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide Heroku app name"
    echo "Usage: ./deploy-heroku.sh <app-name>"
    exit 1
fi

APP_NAME=$1

echo "📝 App Name: $APP_NAME"

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed"
    echo "Install from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if logged in
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Not logged in to Heroku"
    echo "Run: heroku login"
    exit 1
fi

echo "✅ Logged in as: $(heroku auth:whoami)"

# Check if app exists
if heroku apps:info -a $APP_NAME &> /dev/null; then
    echo "✅ App '$APP_NAME' already exists"
else
    echo "📦 Creating Heroku app '$APP_NAME'..."
    heroku create $APP_NAME
fi

# Add Heroku Postgres if not exists
echo "🗄️  Checking PostgreSQL addon..."
if heroku addons -a $APP_NAME | grep -q "heroku-postgresql"; then
    echo "✅ PostgreSQL addon already exists"
else
    echo "📦 Adding PostgreSQL addon..."
    heroku addons:create heroku-postgresql:essential-0 -a $APP_NAME
fi

# Set environment variables
echo "⚙️  Setting environment variables..."

# Generate SECRET_KEY
echo "🔐 Generating SECRET_KEY..."
SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')

heroku config:set \
    SECRET_KEY="$SECRET_KEY" \
    DEBUG=False \
    ALLOWED_HOSTS="$APP_NAME.herokuapp.com" \
    HEROKU_APP_NAME="$APP_NAME" \
    -a $APP_NAME

echo ""
echo "⚠️  IMPORTANT: Set the following environment variables manually:"
echo ""
echo "  FRONTEND_URL (after Vercel deployment):"
echo "    heroku config:set FRONTEND_URL=\"https://your-app.vercel.app\" -a $APP_NAME"
echo ""
echo "  Cloudflare R2 credentials:"
echo "    heroku config:set USE_R2_STORAGE=True -a $APP_NAME"
echo "    heroku config:set R2_ACCESS_KEY_ID=\"your-key\" -a $APP_NAME"
echo "    heroku config:set R2_SECRET_ACCESS_KEY=\"your-secret\" -a $APP_NAME"
echo "    heroku config:set R2_BUCKET_NAME=\"your-bucket\" -a $APP_NAME"
echo "    heroku config:set R2_ENDPOINT_URL=\"https://xxxxx.r2.cloudflarestorage.com\" -a $APP_NAME"
echo ""

read -p "Press Enter to continue with deployment or Ctrl+C to cancel..."

# Add Heroku remote if not exists
if git remote | grep -q "^heroku$"; then
    echo "✅ Heroku remote already exists"
else
    echo "📎 Adding Heroku git remote..."
    heroku git:remote -a $APP_NAME
fi

# Deploy to Heroku
echo "🚢 Deploying to Heroku..."
git subtree push --prefix backend heroku main || git push heroku `git subtree split --prefix backend main`:main --force

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📊 View logs: heroku logs --tail -a $APP_NAME"
echo "🌐 Open app: heroku open -a $APP_NAME"
echo "🏥 Health check: curl https://$APP_NAME.herokuapp.com/healthz/"
echo ""
