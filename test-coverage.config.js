module.exports = {
  extension: ['.js', '.ts', '.vue'],
  all: true,
  exclude: ['**/*.d.ts', '**/*.css', '*.scss'],
  reporter: ['html-spa', 'lcov', 'html'],
  reportDir: './report',
};
