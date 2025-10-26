#!/bin/bash

# Google Cloud Storage deployment script for static assets

set -e

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -b, --bucket BUCKET        GCS bucket name (required)"
    echo "  --skip-build              Skip Docker build and use existing build-output"
    echo "  --no-cleanup              Don't cleanup temporary files"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -b my-frontend-bucket"
    echo "  $0 -b my-bucket --skip-build"
}

# Default configuration
DOCKER_IMAGE="audio-text-frontend"
CONTAINER_NAME="temp-build-container"
BUCKET=""
SKIP_BUILD=false
NO_CLEANUP=false

# API configuration (defaults for production)
API_URL="${REACT_APP_AUDIO_TEXT_API_URL_ENV:-https://api.voiceia.techlab.com}"
WS_URL="${REACT_APP_AUDIO_TEXT_WS_URL_ENV:-wss://api.voiceia.techlab.com}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--bucket)
            BUCKET="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --no-cleanup)
            NO_CLEANUP=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$BUCKET" ]]; then
    echo "❌ Error: Bucket name is required. Use -b or --bucket"
    show_usage
    exit 1
fi

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ Error: Google Cloud SDK (gsutil) is not installed"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Build stage
if [[ "$SKIP_BUILD" == false ]]; then
    echo "🏗️  Building optimized assets for GCS deployment..."
    echo "   API URL: ${API_URL}"
    echo "   WS URL: ${WS_URL}"

    docker build -f Dockerfile.cloud \
        --build-arg REACT_APP_AUDIO_TEXT_API_URL_ENV="${API_URL}" \
        --build-arg REACT_APP_AUDIO_TEXT_WS_URL_ENV="${WS_URL}" \
        -t ${DOCKER_IMAGE}:cloud .

    echo "📦 Extracting build artifacts..."
    docker create --name ${CONTAINER_NAME} ${DOCKER_IMAGE}:cloud
    docker cp ${CONTAINER_NAME}:/build ./build-output
    docker rm ${CONTAINER_NAME}
else
    echo "⏭️  Skipping build, using existing build-output..."
    if [[ ! -d "./build-output" ]]; then
        echo "❌ Error: build-output directory not found. Run without --skip-build first."
        exit 1
    fi
fi

echo "✅ Build artifacts ready in ./build-output/"

# Deploy to Google Cloud Storage
echo "☁️  Deploying to Google Cloud Storage..."

# Sync files to GCS
gsutil -m rsync -r -d ./build-output gs://${BUCKET}

# Set cache control headers
echo "🔧 Setting cache headers..."
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" "gs://${BUCKET}/static/**" 2>/dev/null || true
gsutil -m setmeta -h "Cache-Control:public, max-age=300, must-revalidate" "gs://${BUCKET}/*.html" 2>/dev/null || true

echo "✅ GCS deployment complete!"
echo "📁 Static files deployed to: gs://${BUCKET}"
echo "🌐 Bucket URL: https://storage.googleapis.com/${BUCKET}/index.html"

# Cleanup
if [[ "$NO_CLEANUP" == false ]]; then
    echo "🧹 Cleaning up..."
    if [[ "$SKIP_BUILD" == false ]]; then
        docker rmi ${DOCKER_IMAGE}:cloud 2>/dev/null || true
    fi
    rm -rf ./build-output
else
    echo "⚠️  Skipping cleanup, build-output directory preserved"
fi

echo "✨ Done!"
