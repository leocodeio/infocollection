module.exports = function (options, webpack) {
  return {
    ...options,
    externals: [],
    output: {
      ...options.output,
      libraryTarget: 'commonjs2',
    },
    resolve: {
      ...options.resolve,
      fallback: {
        ...options.resolve?.fallback,
      },
    },
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          const lazyImports = [
            '@nestjs/microservices',
            '@nestjs/platform-socket.io',
            'cache-manager',
            'class-transformer',
            'class-validator',
            '@apollo/subgraph',
            '@apollo/subgraph/package.json',
            '@apollo/subgraph/dist/directives',
            'ts-morph',
            '@nestjs/graphql',
          ];
          if (!lazyImports.includes(resource)) {
            return false;
          }
          try {
            require.resolve(resource);
          } catch (err) {
            return true;
          }
          return false;
        },
      }),
    ],
  };
};
