/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INTERCOM_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
