
import '@dotenvx/dotenvx/config';
const child_process = require('child_process');
const DEV_SERVER_PORT = process.env.API_FRONTEND_PORT || 4200;
// const child = child_process.exec(`ng serve --port=${DEV_SERVER_PORT}`);
const child = child_process.exec(`pnpm run configangular -- --environment=dev && nx serve jcm-app --proxy-config ./proxy.config.json --port=${DEV_SERVER_PORT}`);

child.stderr.on('data', (err: Buffer) => console.error(err.toString()));
child.stdout.on('data', (data: Buffer) => console.log(data.toString()));
