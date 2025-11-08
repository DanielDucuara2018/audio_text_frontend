#!/bin/bash

# Simple development environment setup script

echo "🚀 Starting Audio Text Frontend Development Environment..."

# Create SSL directory if it doesn't exist
mkdir -p nginx/ssl

# Generate SSL certificates if they don't exist
if [ ! -f "nginx/ssl/nginx-selfsigned.crt" ] || [ ! -f "nginx/ssl/nginx-selfsigned.key" ]; then
    echo "🔐 Generating SSL certificates..."
    
    # Generate private key
    openssl genrsa -out nginx/ssl/nginx-selfsigned.key 2048
    
    # Generate certificate
    openssl req -new -x509 -key nginx/ssl/nginx-selfsigned.key -out nginx/ssl/nginx-selfsigned.crt -days 365 -subj "/C=US/ST=Development/L=Local/O=AudioText/OU=Development/CN=localhost/emailAddress=dev@localhost" -extensions v3_req -config <(
    echo '[req]'
    echo 'distinguished_name = req'
    echo '[v3_req]'
    echo 'keyUsage = keyEncipherment, dataEncipherment'
    echo 'extendedKeyUsage = serverAuth'
    echo 'subjectAltName = @alt_names'
    echo '[alt_names]'
    echo 'DNS.1 = localhost'
    echo 'DNS.2 = voiceia.danobhub.local'
    echo 'DNS.3 = api.voiceia.danobhub.local'
    echo 'IP.1 = 127.0.0.1'
    )
    
    echo "✅ SSL certificates generated successfully"
fi

# Generate DH parameters if they don't exist
if [ ! -f "nginx/ssl/dhparam.pem" ]; then
    echo "🔑 Generating DH parameters (this may take a moment)..."
    openssl dhparam -out nginx/ssl/dhparam.pem 2048
    echo "✅ DH parameters generated successfully"
fi

# Add hostnames to /etc/hosts if not already present
if ! grep -q "voiceia.danobhub.local" /etc/hosts; then
    echo "📝 Adding hostnames to /etc/hosts (requires sudo)..."
    echo "127.0.0.1 voiceia.danobhub.local api.voiceia.danobhub.local" | sudo tee -a /etc/hosts
fi

# Add SSL certificate to system trust store
CERT_DEST="/usr/local/share/ca-certificates/voiceia-danobhub.crt"
if [ ! -f "$CERT_DEST" ] || ! cmp -s "nginx/ssl/nginx-selfsigned.crt" "$CERT_DEST"; then
    echo "🔒 Adding SSL certificate to system trust store (requires sudo)..."
    sudo cp nginx/ssl/nginx-selfsigned.crt "$CERT_DEST"
    sudo update-ca-certificates
    echo "✅ Certificate added to system trust store"
    echo "⚠️  Please restart your browser completely for the changes to take effect"
fi

# Start the development environment
echo "🐳 Starting Docker containers..."
docker-compose up -d --build

echo "✅ Development environment is ready!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: https://voiceia.danobhub.local"
echo "   API:      https://api.voiceia.danobhub.local"
echo ""
echo "🔧 Features enabled:"
echo "   ✓ SSL/TLS encryption"
echo "   ✓ WebSocket support"
echo "   ✓ Separate domains for frontend and API"
echo "   ✓ React hot reload"
echo ""
echo "📝 To stop: docker-compose down"
echo "🧹 To clean up: docker-compose down -v"