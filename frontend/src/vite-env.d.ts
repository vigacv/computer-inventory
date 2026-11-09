/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Where the API lives. Absolute (https://api.example.com/api) or relative to the
   * SPA's origin (default "/api", served through the Vite dev proxy or nginx).
   */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
