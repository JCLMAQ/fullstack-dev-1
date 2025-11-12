// Script pour injecter le port du .env dans project.json
import '@dotenvx/dotenvx/config';
import { readFile, writeFile } from 'fs/promises';

async function updateProjectConfig() {
  const projectJsonPath = './apps/frontend/dev-app/project.json';
  const port = process.env.API_FRONTEND_PORT || '4200';

  try {
    // Lire le fichier project.json
    const projectConfig = JSON.parse(await readFile(projectJsonPath, 'utf8'));

    // Mettre à jour la configuration serve avec le port du .env
    if (!projectConfig.targets.serve.options) {
      projectConfig.targets.serve.options = {};
    }
    projectConfig.targets.serve.options.port = parseInt(port);

    // Mettre à jour aussi serve-static si nécessaire
    if (projectConfig.targets['serve-static']?.options) {
      projectConfig.targets['serve-static'].options.port = parseInt(port);
    }

    // Écrire le fichier modifié
    await writeFile(projectJsonPath, JSON.stringify(projectConfig, null, 2));

    console.log(`✅ project.json mis à jour avec le port ${port}`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de project.json:', error);
    process.exit(1);
  }
}

updateProjectConfig();
