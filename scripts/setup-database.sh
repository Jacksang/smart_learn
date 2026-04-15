#!/bin/bash
# Smart Learn Database Setup Script
# This script creates the smartlearn user and database if needed

echo "🔧 Smart Learn Database Setup"
echo "=============================="
echo ""

# Try with postgres user
echo "📊 Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running"
    exit 1
fi
echo "✅ PostgreSQL is running"

# Check if we have sudo access
echo ""
echo "🔐 Checking sudo access..."
if sudo -n true 2>/dev/null; then
    echo "✅ Sudo access available (no password required)"
    SUDO_AVAILABLE=true
else
    echo "⚠️  Sudo requires password - will be prompted"
    SUDO_AVAILABLE=false
fi

# Try to create/reset user
echo ""
echo "👤 Creating/Resetting smartlearn user..."
if [ "$SUDO_AVAILABLE" = true ]; then
    sudo -u postgres psql -c "CREATE USER smartlearn WITH PASSWORD 'password' SUPERUSER;" 2>&1 || \
    sudo -u postgres psql -c "ALTER USER smartlearn WITH PASSWORD 'password' SUPERUSER;" 2>&1
    RESULT=$?
else
    echo "📝 You'll need to run this manually with your password:"
    echo "   sudo -u postgres psql -c \"CREATE USER smartlearn WITH PASSWORD 'password' SUPERUSER;\""
    exit 1
fi

# Create database if it doesn't exist
echo ""
echo "📦 Creating database 'smartlearn' if needed..."
DATABASE_EXISTS=$(sudo -u postgres psql -t -c "SELECT 1 FROM pg_database WHERE datname='smartlearn';" -A)
if [ "$DATABASE_EXISTS" != "1" ]; then
    sudo -u postgres psql -c "CREATE DATABASE smartlearn OWNER smartlearn;"
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully"
    else
        echo "❌ Failed to create database"
        exit 1
    fi
else
    echo "✅ Database already exists"
fi

# Set permissions
echo ""
echo "🔒 Granting permissions..."
sudo -u postgres psql -d smartlearn -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smartlearn;" 2>&1 || true
sudo -u postgres psql -d smartlearn -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO smartlearn;" 2>&1 || true

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file:"
echo "   echo 'DB_PASSWORD=password' > .env"
echo ""
echo "2. Run migration:"
echo "   cd backend"
echo "   node scripts/run-migrations.js"
echo ""
echo "3. Start server:"
echo "   npm run backend:dev"
