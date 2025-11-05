// webpack.config.js
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = function (options, webpack) {
  const lazyImports = [
    '@nestjs/microservices',
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets',
    '@nestjs/websockets/socket-module',
    '@apollo/subgraph',
    '@apollo/subgraph/package.json',
    '@apollo/subgraph/dist/directives',
    'ts-morph',
  ];

  return {
    ...options,
    externals: [
      nodeExternals({
        modulesDir: path.resolve(__dirname, '../../node_modules'),
        allowlist: [
          'better-auth',
          '@better-auth/core',
          '@thallesp/nestjs-better-auth',
          /^jose/,
        ],
      }),
      nodeExternals({
        modulesDir: path.resolve(__dirname, 'node_modules'),
        allowlist: [
          'better-auth',
          '@better-auth/core',
          '@thallesp/nestjs-better-auth',
          /^jose/,
        ],
      }),
    ],
    output: {
      ...options.output,
      libraryTarget: 'commonjs2',
    },
    resolve: {
      ...options.resolve,
      fullySpecified: false,
      modules: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, '../../node_modules'),
        'node_modules',
      ],
    },
    module: {
      ...options.module,
      rules: [
        ...options.module.rules,
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    },
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (lazyImports.includes(resource)) {
            try {
              require.resolve(resource);
            } catch (err) {
              return true;
            }
          }
          return false;
        },
      }),
    ],
  };
};
