// Create the "proxy configuration file" for the Angular app

const { writeFile } = require('fs');
// read server variables from .env file with dotenvx (automatic expansion)
require('@dotenvx/dotenvx/config');

// Verify that all variables are provided
if (!process.env.API_BACKEND || !process.env.API_BACKEND_PORT || !process.env.NEST_SERVER_SECURE || !process.env.NEST_SERVER_PATHREWRITE || !process.env.NEST_SERVER_LOGLEVEL || !process.env.NEST_SERVER_CHANGEORIGINE) {
  console.error('All the required proxy variables were not provided!');
  process.exit(-1);
}

const proxyconfPath = 'proxy.config.json';

// we have access to our proxy variables
// in the process.env object thanks to dotenv
const proxyFileContent = `
  {
    "/api": {
    "target": "http://${process.env.API_BACKEND}:${process.env.API_BACKEND_PORT}",
    "secure": ${process.env.NEST_SERVER_SECURE},
    "pathRewrite": ${process.env.NEST_SERVER_PATHREWRITE},
    "logLevel": "${process.env.NEST_SERVER_LOGLEVEL}",
    "changeOrigin": ${process.env.NEST_SERVER_CHANGEORIGINE}
    }
  }
`;
// write the content to the respective file
writeFile(proxyconfPath, proxyFileContent, function (err: NodeJS.ErrnoException | null) {
  if (err) {
    console.log(err);
  }
  console.log(`Wrote variables to ${proxyconfPath}`);
});
