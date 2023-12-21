import { config } from '../../common.jest.config.mjs';

export default config(import.meta, {
  setupFilesAfterEnv: ['<rootDir>/__tests__/configureEnvironment.js'],
  testURL: 'http://localhost/',
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__tests__/fileMock.js',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^redux-persist/lib/storage': '<rootDir>/__tests__/fileMock.js',
  },
  moduleFileExtensions: ['js'],
  moduleDirectories: ['node_modules', 'app/node_modules'],
  testPathIgnorePatterns: ['<rootDir>/stories', '<rootDir>/.storybook'],
  modulePathIgnorePatterns: ['<rootDir>/stories', '<rootDir>/.storybook'],
  transformIgnorePatterns: ['<rootDir>/stories', '<rootDir>/.storybook'],
});
