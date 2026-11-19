/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL including /api, for example https://my-api.up.railway.app/api */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
