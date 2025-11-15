/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUDIO_TEXT_API_URL_ENV: string
  readonly VITE_AUDIO_TEXT_WS_URL_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
