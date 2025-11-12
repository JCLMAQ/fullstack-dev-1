const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join, resolve } = require('path');

module.exports = {
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      // Backend libs
      '@be/posts': resolve(__dirname, '../../../libs/backend/data-access/posts/src/index.ts'),
      '@be/users': resolve(__dirname, '../../../libs/backend/data-access/users/src/index.ts'),
      '@be/images': resolve(__dirname, '../../../libs/backend/data-access/images/src/index.ts'),
      // DB libs
      '@db/prisma': resolve(__dirname, '../../../libs/db/index.ts'),
      '@db/prisma-client': resolve(
        __dirname,
        '../../../libs/backend/prisma-client/src/index.ts'
      ),
    },
  },
  output: {
    path: join(__dirname, '../../../dist/apps/backend/nest-app'),
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMaps: true,
    }),
  ],
};
