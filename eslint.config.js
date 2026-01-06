import neostandard from 'neostandard'

export default [
  ...neostandard({
    ignores: [
      'dist/**',
      'node_modules/**',
    ],
    ts: true,
  }),
]
