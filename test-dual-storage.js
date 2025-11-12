#!/usr/bin/env node

const http = require('http');

function testDualStorageEndpoint() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/dual-storage',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response body:', data);
      if (res.statusCode === 404) {
        console.log('❌ Endpoint dual-storage non trouvé - le contrôleur n\'est pas enregistré');
      } else if (res.statusCode === 405) {
        console.log('✅ Endpoint dual-storage trouvé mais méthode GET non supportée (normal)');
      } else {
        console.log('✅ Endpoint dual-storage accessible');
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Erreur de connexion:', error.message);
    console.log('Le serveur backend n\'est probablement pas démarré sur le port 3000');
  });

  req.on('timeout', () => {
    console.log('❌ Timeout - le serveur ne répond pas');
    req.destroy();
  });

  req.end();
}

console.log('Test de l\'endpoint /api/dual-storage...');
testDualStorageEndpoint();
