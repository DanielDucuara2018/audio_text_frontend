# Audio to Text Front-End Application

This repository contains the front-end component of an Audio-to-Text application. The application provides a user interface that allows users to upload audio files and receive transcribed text outputs. It is designed to interact with a back-end service responsible for processing audio files and returning the corresponding text.

## Features

- User-friendly interface for uploading audio files
- Real-time display of transcription results
- Responsive design suitable for various devices
- Integration with back-end API for audio processing

## Technologies Used

- JavaScript
- HTML
- CSS
- Docker (for development environment)

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine
- Docker and Docker Compose (for development setup)

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

You can run the application in a development environment using Docker Compose:

```bash
docker-compose -f docker-compose.dev.yml up -d --build app_dev
```

This will start the development server, and you can access the application at `http://localhost:3000`.

## Project Structure

- `public/` - Contains static assets and the main HTML file
- `src/` - Contains the main source code for the React application
- `resources/` - Contains additional resources and assets
- `Dockerfile.dev` - Docker configuration for development environment
- `docker-compose.dev.yml` - Docker Compose configuration for development

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
