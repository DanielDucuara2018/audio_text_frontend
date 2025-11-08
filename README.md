# Audio to Text Front-End Application

This repository contains the front-end component of an Audio-to-Text application. The application provides a user interface that allows users to upload audio files and receive transcribed text outputs. It is designed to interact with a back-end service responsible for processing audio files and returning the corresponding text.

## Features

- User-friendly interface for uploading audio files
- Real-time display of transcription results
- Responsive design suitable for various devices
- Integration with back-end API for audio processing
- Automated cloud deployment with CI/CD
- Google Cloud Platform deployment

## Technologies Used

- **Frontend**: React.js, Redux, HTML5, CSS3
- **Build Tools**: Node.js, npm, webpack
- **Containerization**: Docker, Google Cloud Build
- **CI/CD**: GitHub Actions, Google Cloud Platform
- **Cloud Storage**: Google Cloud Storage
- **CDN**: Cloudflare (DNS, SSL/TLS, DDoS protection)

## Getting Started

### Prerequisites

- Node.js 22+ and npm installed on your machine
- Docker and Docker Compose (for development setup)
- Google Cloud Platform account (for production deployment)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/DanielDucuara2018/audio_text_frontend.git
   ```

2. Navigate to the project directory:

   ```bash
   cd audio_text_frontend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

### Running the Application

#### Development Environment

The simplest way to start the development environment is running the app container:

```bash
docker-compose up -d --build app
```

If you want to check a more complex dev environment using the ngnix container, run the following script!

```bash
./scripts/start-dev.sh
```

This script will automatically:

- Generate SSL certificates (self-signed) for HTTPS
- Generate DH parameters for secure SSL
- Add hostname mapping to `/etc/hosts`
- Start all Docker containers

**Access the application:**

- **HTTP**: `http://localhost` (redirects to HTTPS)
- **HTTPS**: `https://localhost`
- **Custom hostname**: `https://voiceia.techlab.local`

**Features:**

- ✅ SSL/TLS encryption with auto-generated certificates
- ✅ WebSocket support for real-time communication
- ✅ Automatic HTTP to HTTPS redirect
- ✅ API proxy to backend service (`/api/v1/` → backend:3203)
- ✅ WebSocket proxy (`/api/v1/job/ws/` → backend:3203)
- ✅ Hot reload support for React development

**Manual start (without script):**

```bash
docker-compose up -d --build
```

#### Local Development (without Docker)

```bash
npm start
```

The application will be available at `http://localhost:3202`.

## Cloud Deployment

This application supports automated deployment to multiple cloud providers with CDN integration.

### Automated CI/CD Deployment

The project uses GitHub Actions with Google Cloud Build for automated deployment:

- **Push to `main`**: Deploys to staging environment
- **Push to `production`**: Deploys to production environment
- **Manual trigger**: Deploy any branch to any environment via GitHub Actions

### Setup Instructions

#### 1. Google Cloud Platform Setup

1. **Create GCP Project**:

   ```bash
   gcloud projects create your-project-id
   gcloud config set project your-project-id
   ```

2. **Enable Required APIs**:

   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable storage.googleapis.com
   gcloud services enable container.googleapis.com
   ```

3. **Create Storage Bucket**:

   ```bash
   gsutil mb gs://your-app-bucket
   gsutil web set -m index.html -e index.html gs://your-app-bucket
   ```

4. **Create Service Account**:

   ```bash
   gcloud iam service-accounts create github-actions \
       --description="GitHub Actions deployment" \
       --display-name="GitHub Actions"

   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
       --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
       --role="roles/cloudbuild.builds.editor"

   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
       --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
       --role="roles/storage.admin"

   gcloud iam service-accounts keys create key.json \
       --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

#### 2. GitHub Repository Configuration

Go to **Settings > Secrets and variables > Actions** and add:

**Repository Variables**:

- `GCP_PROJECT_ID`: Your GCP project ID
- `GCP_STORAGE_BUCKET_STAGING`: Staging bucket name (e.g., `my-app-staging`)
- `GCP_STORAGE_BUCKET_PRODUCTION`: Production bucket name (e.g., `my-app-production`)

**Repository Secrets**:

- `GCP_SA_KEY`: Service account JSON key (content of key.json)

#### 3. Cloud Build Configuration

The deployment uses a `ci/deployment.yaml` file for Google Cloud Build:

```yaml
# Build static files using Cloud Build
steps:
  # Build React app with Docker
  - name: "gcr.io/cloud-builders/docker"
    args:
      [
        "build",
        "-f",
        "Dockerfile.cloud",
        "--target",
        "builder",
        "-t",
        "temp-build",
        ".",
      ]

  # Extract build files
  - name: "gcr.io/cloud-builders/docker"
    args: ["create", "--name", "temp-container", "temp-build"]
  - name: "gcr.io/cloud-builders/docker"
    args: ["cp", "temp-container:/app/build", "/workspace/build-output"]

  # Deploy to Storage
  - name: "gcr.io/cloud-builders/gsutil"
    args:
      ["rsync", "-r", "-d", "/workspace/build-output/", "gs://${_BUCKET_NAME}"]
```

### Deployment Architecture

The deployment uses Google Cloud Platform with Cloudflare for global CDN:

- **Build**: Docker multi-stage build with Cloud Build
- **Storage**: Google Cloud Storage for static files
- **CDN**: Cloudflare for DNS, SSL/TLS, caching, and DDoS protection
- **Region**: europe-west4 (Netherlands)

**Benefits:**

- ✅ Automated builds with Google Cloud Build
- ✅ Global content delivery via Cloudflare
- ✅ Free SSL/TLS certificates
- ✅ DDoS protection and WAF
- ✅ Optimized cache headers for static assets

### Manual Deployment Script

For manual deployments or testing, use the included `deploy-cloud.sh` script:

```bash
# Deploy to Google Cloud Storage
./scripts/deploy-cloud.sh -b my-bucket-name

# Skip build and use existing build-output
./scripts/deploy-cloud.sh -b my-bucket-name --skip-build

# Keep build artifacts after deployment
./scripts/deploy-cloud.sh -b my-bucket-name --no-cleanup

# See all options
./scripts/deploy-cloud.sh --help
```

### Quick Manual Commands

For simple manual deployment without the script:

```bash
# Build production files
npm run build

# Deploy to Google Cloud Storage
gsutil rsync -r -d ./build gs://your-bucket

# Set cache headers
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" "gs://your-bucket/static/**"
gsutil -m setmeta -h "Cache-Control:public, max-age=300, must-revalidate" "gs://your-bucket/*.html"
```

### Cloudflare Worker Setup

To use a custom domain (e.g., `voiceia.danobhub.com`) with Cloud Storage:

**1. Deploy the Worker:**

- Go to Cloudflare Dashboard → Workers & Pages
- Create Worker named `voiceia-proxy`
- Copy code from `cloudflare-worker.js`
- Deploy

**2. Set Environment Variable:**

- Worker Settings → Variables
- Add: `BUCKET_NAME` = `hispanie-frontend` (your bucket name)

**3. Add Route:**

- Your domain → Workers Routes → Add Route
- Route: `voiceia.danobhub.com/*`
- Worker: `voiceia-proxy`

**4. Configure DNS:**

- DNS → Records → Add
- Type: `A`, Name: `voiceia`, Content: `192.0.2.1`, Proxied: ON

**Why?** The worker keeps your custom domain in the browser while serving content from Cloud Storage.

## Project Structure

```
├── ci/
|   ├── deployment.yaml           # Google Cloud Build configuration
├── public/                     # Static assets and HTML template
├── src/                        # React application source code
│   ├── components/            # React components
│   ├── actions/               # Redux actions
│   ├── reducers/              # Redux reducers
│   └── ...
├── .github/workflows/         # GitHub Actions workflows
├── Dockerfile.dev            # Development Docker configuration
├── Dockerfile.cloud          # Production cloud build configuration
├── docker-compose.yml    # Development Docker Compose
└── package.json              # Node.js dependencies and scripts
```

## Environment Configuration

### Development

Create a `.env.local` file for local development:

```env
REACT_APP_API_URL=http://localhost:3203
REACT_APP_ENVIRONMENT=development
```

### Production

Environment variables are configured in GitHub repository settings:

- `REACT_APP_API_URL`: Production API endpoint
- `REACT_APP_ENVIRONMENT`: Environment name (staging/production)

## Build and Deployment Process

1. **Code Push**: Developer pushes code to main/production branch
2. **GitHub Actions**: Triggers automated workflow
3. **Cloud Build**: Uses gcr.io builders to create optimized build
4. **Storage Upload**: Deploys static files to cloud storage
5. **CDN Invalidation**: Clears CDN cache for immediate updates
6. **Notification**: Success/failure notifications

## Monitoring and Troubleshooting

### Build Logs

- **GitHub Actions**: Check workflow logs in Actions tab
- **Cloud Build**: View build history in GCP Console
- **Storage**: Verify file uploads in cloud storage console

### Common Issues

1. **Permission denied**: Check service account permissions
2. **Build fails**: Verify Node.js version and dependencies
3. **Files not updating**: Check CDN cache invalidation
4. **CORS errors**: Configure bucket CORS policies

### Debug Commands

```bash
# Check build locally
docker build -f Dockerfile.cloud --target verify .

# Test cloud build locally
gcloud builds submit --config ci/deployment.yaml

# Verify deployment
curl -I https://your-domain.com
```

## Performance Features

- **Pre-compressed files**: Gzip compression for faster loading
- **CDN integration**: Global content delivery
- **Build optimization**: Tree-shaking and code splitting
- **Caching strategy**: Optimized cache headers
- **Progressive loading**: Lazy loading for components

## Security

- **HTTPS-only**: Enforced secure connections
- **CSP headers**: Content Security Policy implementation
- **CORS configuration**: Proper cross-origin resource sharing
- **Access controls**: IAM-based permissions
- **Audit logging**: Cloud provider audit trails

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Create Pull Request

### Development Workflow

1. Make changes in development branch
2. Test locally using `npm start` or Docker
3. Push changes to trigger CI pipeline
4. Review deployment in staging environment
5. Merge to production branch for production deployment

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
