// Create the "environment files" for the Angular app
import '@dotenvx/dotenvx/config';
import { writeFile } from 'fs';
import path from 'path';

// dotenvx gère automatiquement l'expansion des variables d'environnement
const repoRoot = process.cwd();
const loadedPath = path.join(repoRoot, '.env');

console.log(`Using dotenvx with .env file: ${loadedPath}`);

const environment = process.env.NODE_ENV || 'dev';

const required = [
  'API_FRONTEND',
  'API_FRONTEND_PORT',
  'API_BACKEND_URL',
  'API_BACKEND_PREFIX',
  'API_BACKEND',
  'API_BACKEND_PORT',
  'API_SECRET',
  'AUTO_REGISTRATION_ENABLE',
  'REGISTRATION_VALIDATION',
  'PWDLESS_LOGIN_ENABLE',
  'DEFAULT_LANGUAGE',
  'SUPPORTED_LANGUAGE',
];

const missing = required.filter((k) => !(k in process.env));
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  if (loadedPath) console.error(`Loaded from: ${loadedPath}`);
  process.exit(-1);
}

// Fonction pour générer le contenu d'un fichier d'environnement
function generateEnvironmentContent(isProduction: boolean): string {
  // Utiliser la variable d'environnement API_FRONTEND_PORT
  const frontendPort = process.env.API_FRONTEND_PORT || '4200';

  return `
    export const ENVIRONMENT_DATA = {
        production: ${isProduction},
        API_BACKEND_URL: "http://${process.env.API_BACKEND}:${process.env.API_BACKEND_PORT}",
        API_BACKEND_PREFIX: "${process.env.API_BACKEND_PREFIX}",
        API_FRONTEND_URL: "http://${process.env.API_FRONTEND}:${frontendPort}",
        API_FRONTEND: "${process.env.API_FRONTEND}",
        API_FRONTEND_PORT: "${frontendPort}",
        API_SECRET: "${process.env.API_SECRET}",
        AUTO_REGISTRATION_ENABLE: "${process.env.AUTO_REGISTRATION_ENABLE}",
        REGISTRATION_VALIDATION: "${process.env.REGISTRATION_VALIDATION}",
        PWDLESS_LOGIN_ENABLE: "${process.env.PWDLESS_LOGIN_ENABLE}",
        defaultLanguage: "${process.env.DEFAULT_LANGUAGE}",
        supportedLanguages: ${process.env.SUPPORTED_LANGUAGE}
    };`;
}

// Configuration des fichiers à générer
const environments = [
  {
    name: 'development',
    path: './apps/frontend/dev-app/environments/environment.ts',
    isProduction: false
  },
  {
    name: 'production',
    path: './apps/frontend/dev-app/environments/environment.prod.ts',
    isProduction: true
  }
];

// Génération des fichiers d'environnement
let filesWritten = 0;
const totalFiles = environments.length;

environments.forEach(env => {
  const environmentFileContent = generateEnvironmentContent(env.isProduction);

  writeFile(env.path, environmentFileContent, function (err?: NodeJS.ErrnoException | null) {
    if (err) {
      console.error(`ERROR writing ${env.name} environment file:`, err);
      process.exit(-1);
    }

    console.log(`✅ Wrote ${env.name} variables to ${env.path}${loadedPath ? ` (from ${loadedPath})` : ''}`);

    filesWritten++;
    if (filesWritten === totalFiles) {
      console.log(`\n🎉 Successfully generated ${totalFiles} environment files!`);
    }
  });
});
