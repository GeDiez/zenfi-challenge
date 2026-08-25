import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import neostandard, { resolveIgnoresFromGitignore } from 'neostandard'

export default [
  { ignores: [...resolveIgnoresFromGitignore(), 'coverage/**'] },

  js.configs.recommended,

  // Standard style, TypeScript-aware. `noStyle` hands all formatting to Prettier.
  ...neostandard({
    ts: true,
    noStyle: true,
  }),

  {
    files: ['**/*.{ts,tsx}'],
    // neostandard pins settings.react.version to '17'; this project is on React 19.
    settings: {
      react: { version: '19' },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // Prettier last: strips any remaining formatting rules.
  prettierConfig,
]
