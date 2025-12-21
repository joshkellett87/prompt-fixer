module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/**/*.test.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/**/*.test.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ],
  verbose: true
};
