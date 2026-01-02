import { useState, useEffect } from 'react';
import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki';

// Map file extensions to Shiki language identifiers
const extensionToLanguage: Record<string, BundledLanguage> = {
  // JavaScript/TypeScript
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'tsx',

  // Web
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  vue: 'vue',
  svelte: 'svelte',

  // Data formats
  json: 'json',
  json5: 'json5',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  xml: 'xml',

  // Shell
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  fish: 'fish',
  ps1: 'powershell',

  // Backend languages
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  scala: 'scala',
  php: 'php',
  cs: 'csharp',
  fs: 'fsharp',
  swift: 'swift',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',

  // Config files
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  cmake: 'cmake',
  nginx: 'nginx',

  // Markup
  md: 'markdown',
  mdx: 'mdx',
  tex: 'latex',
  rst: 'rst',

  // Database
  sql: 'sql',
  graphql: 'graphql',
  gql: 'graphql',

  // Other
  diff: 'diff',
  prisma: 'prisma',
  env: 'dotenv',
};

// Get language from file path
export function getLanguageFromPath(filePath: string): BundledLanguage | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!ext) return null;

  // Handle special filenames
  const filename = filePath.split('/').pop()?.toLowerCase() ?? '';
  if (filename === 'dockerfile') return 'dockerfile';
  if (filename === 'makefile' || filename === 'gnumakefile') return 'makefile';
  if (filename.startsWith('.env')) return 'dotenv';

  return extensionToLanguage[ext] ?? null;
}

// Languages to preload for better performance
const preloadLanguages: BundledLanguage[] = [
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'json',
  'html',
  'css',
  'markdown',
  'bash',
  'yaml',
];

let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighterInstance(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light'],
      langs: preloadLanguages,
    });
  }
  return highlighterPromise;
}

export function useHighlighter() {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getHighlighterInstance().then((h) => {
      if (mounted) {
        setHighlighter(h);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const highlight = async (
    code: string,
    filePath: string
  ): Promise<string | null> => {
    if (!highlighter) return null;

    const lang = getLanguageFromPath(filePath);
    if (!lang) return null;

    try {
      // Load language if not already loaded
      const loadedLangs = highlighter.getLoadedLanguages();
      if (!loadedLangs.includes(lang)) {
        await highlighter.loadLanguage(lang);
      }

      const html = highlighter.codeToHtml(code, {
        lang,
        theme: 'github-light',
      });

      // Extract just the inner content from the pre/code tags
      // Shiki returns: <pre ...><code>...</code></pre>
      const match = html.match(/<code[^>]*>([\s\S]*)<\/code>/);
      return match ? match[1] : null;
    } catch {
      // Language not supported or error - return null to fall back to plain text
      return null;
    }
  };

  return { highlighter, loading, highlight };
}
