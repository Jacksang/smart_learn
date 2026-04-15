#!/bin/bash
# Database Reset Script for Smart Learn
# This script will reset the smartlearn user password and create the database if needed

echo "🔧 Smart Learn Database Reset Script"
echo "====================================="
echo ""

# Set your PostgreSQL password (you'll be prompted)
echo "⚠️  This script requires sudo access to reset the PostgreSQL password."
echo "Please have your sudo password ready."
echo ""

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL status..."
pg_isready -h localhost -p 5432
if [ $? -ne 0 ]; then
    echo "❌ PostgreSQL is not running. Please start it first."
    exit 1
fi
echo "✅ PostgreSQL is running"
echo ""

# Reset PostgreSQL user password
echo "🔄 Resetting smartlearn user password..."
echo "You will be prompted for your sudo password."
sudo -u postgres psql -c "ALTER USER smartlearn WITH PASSWORD 'password';"
if [ $? -eq 0 ]; then
    echo "✅ Password reset successful"
else
    echo "❌ Failed to reset password"
    exit 1
fi
echo ""

# Check if database exists
echo "📊 Checking if smartlearn database exists..."
DATABASE_EXISTS=$(sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname='smartlearn';" -t -A)
if [ "$DATABASE_EXISTS" = "1" ]; then
    echo "✅ Database 'smartlearn' exists"
else
    echo "📦 Database 'smartlearn' not found. Creating..."
    sudo -u postgres psql -c "CREATE DATABASE smartlearn OWNER smartlearn;"
    if [ $? -eq 0 ]; then
        echo "✅ Database 'smartlearn' created"
    else
        echo "❌ Failed to create database"
        exit 1
    fi
fi
echo ""

# Create .env file with correct password
echo "📝 Updating .env file with correct password..."
if [ -f ".env" ]; then
    echo "DB_PASSWORD=password" > .env
    echo "✅ .env file updated"
else
    echo "DB_PASSWORD=password" > .env
    echo "✅ .env file created"
fi
echo ""

echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run the database migration:"
echo "   cd backend"
echo "   node scripts/run-migrations.js"
echo ""
echo "2. Start the server:"
echo "   npm run backend:dev"
echo ""
echo "3. Test the API endpoints (they will be available after migration)"
