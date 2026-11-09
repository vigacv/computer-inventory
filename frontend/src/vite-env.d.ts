/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Where the API lives, e.g. "http://localhost:5080/api" (default, see .env).
   * A relative value is resolved against the SPA's origin.
   */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
