module.exports = {
  extension: ['.js', '.ts', '.vue'],
  completeCopy: true,
  exclude: ['**/*.d.ts', '**/*.css', '*.scss'],
  reporter: ['html-spa', 'lcov', 'html'],
  reportDir: './report',
};
