module.exports = {
  coverageDirectory: '.reports/coverage',
  collectCoverageFrom: ['src/**/**/*.{ts,tsx}', '!**/__tests__/**',],
  coveragePathIgnorePatterns: ['app/pages/_*', 'app/utils'],

  coverageReporters: [
    'html',
    'cobertura'
  ],

  coverageThreshold: {
    global: {
      branches: 94,
      functions: 94,
      lines: 94,
      statements: 94
    }
  },

  reporters: [
    ['jest-junit', {
      outputDirectory: '.reports',
      outputName: 'jest.xml',
      ancestorSeparator: ' > ',
    }]
  ],

  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.spec.json',
    },
  },

  moduleDirectories: ['node_modules', 'bin'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'md'],

  // moduleNameMapper: {
  //   "\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/config/__mocks__/static.mock.ts",
  //   "\\.(css|sass|scss|styl|less)$": "<rootDir>/config/__mocks__/style.mock.ts",
  //   '@utils': '<rootDir>/app/utils',
  //   '@hoc': '<rootDir>/app/hoc',
  //   '@generic': '<rootDir>/app/generic',
  //   '@features': '<rootDir>/app/features',
  //   '@components': '<rootDir>/app/components',
  //   '@containers': '<rootDir>/app/containers',
  //   '@interfaces': '<rootDir>/app/base/interfaces',
  //   '@helpers': '<rootDir>/app/base/helpers',
  //   '@enums': '<rootDir>/app/base/enums',
  // },

  resolver: 'jest-resolve-cached',

  testEnvironment: 'node',

  // setupFiles: ['<rootDir>/config/jest/jest.setup.ts'],

  // projects: ['app/'],

  // snapshotSerializers: ['<rootDir>/node_modules/enzyme-to-json/serializer'],

  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    "^.+\\.md?$": "markdown-loader-jest"
  },

  testMatch: ['**/__tests__/**/*(*.)(spec).ts?(x)'],
}
