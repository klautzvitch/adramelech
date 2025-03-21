import type { Config } from 'prettier';

export default {
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
} satisfies Config;
