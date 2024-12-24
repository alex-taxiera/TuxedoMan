import atx from '@alex-taxiera/eslint-config-ts'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
export default [
  {
    ...atx,
    ...eslintPluginPrettierRecommended,
    files: ['**/*.js', '**/*.ts'],
  },
]
