import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescriptConfig from 'eslint-config-next/typescript';

/**
 * Flat config. Next 16 ships its shareable configs as flat arrays, so no
 * eslintrc compatibility layer is needed.
 */
const config = [
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'] },
  ...coreWebVitals,
  ...typescriptConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/\\.glb$/]",
          message: 'Asset paths belong in the asset registry, not in components (CLAUDE.md rule 4).',
        },
      ],
    },
  },
];

export default config;
