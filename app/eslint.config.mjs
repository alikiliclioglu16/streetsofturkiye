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
    },
  },
  {
    // Model paths belong in the asset and hero registries. Components resolve
    // assets through those registries and never name a file (CLAUDE.md rule 4).
    files: ['src/components/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/\\.glb$/]",
          message: 'Asset paths belong in the asset or hero registry, not in components.',
        },
      ],
    },
  },
];

export default config;
