module.exports = {
  extension: ['.js', '.ts', '.vue'],
  all: true,
  exclude: ['**/*.d.ts', '**/*.css', '*.scss'],
  reporter: ['html-spa', 'lcov', 'html'],
  reportDir: './report',

  gitlab: {
    https: false,
    host: '192.168.13.78',
  },
};
