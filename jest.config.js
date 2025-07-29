module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  setupFiles: ['./jest.setup.js'],
  verbose: true,
  coverageDirectory: './coverage/',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/img.js'
  ],
  modulePathIgnorePatterns: [
    'npm-cache',
    '.npm'
  ],
  // Mock 파일 설정
  moduleNameMapper: {
    // 정적 자산 모킹
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    // 스타일 모킹
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
    // node:stream 같은 Node.js 내장 모듈 문제 해결
    '^node:(.*)$': '<rootDir>/node_modules/$1',
  },
  transformIgnorePatterns: [
    // React Native은 node_modules에서도 변환이 필요함
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-native-.*)/)',
  ],
  testEnvironment: 'jsdom',  // node -> jsdom으로 변경
  globals: {
    __DEV__: true
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  // 모킹 자동화
  automock: false,
  unmockedModulePathPatterns: [
    'node_modules/react/',
    'node_modules/enzyme/'
  ]
};
