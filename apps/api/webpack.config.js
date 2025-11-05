// webpack.config.js
const nodeExternals = require('webpack-node-externals');

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
