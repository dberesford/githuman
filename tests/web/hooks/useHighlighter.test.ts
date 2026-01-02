import { describe, it, expect } from 'vitest';
import { getLanguageFromPath } from '../../../src/web/hooks/useHighlighter';

describe('getLanguageFromPath', () => {
  it('should return correct language for JavaScript files', () => {
    expect(getLanguageFromPath('src/index.js')).toBe('javascript');
    expect(getLanguageFromPath('src/index.mjs')).toBe('javascript');
    expect(getLanguageFromPath('src/index.cjs')).toBe('javascript');
  });

  it('should return correct language for TypeScript files', () => {
    expect(getLanguageFromPath('src/index.ts')).toBe('typescript');
    expect(getLanguageFromPath('src/index.mts')).toBe('typescript');
    expect(getLanguageFromPath('src/component.tsx')).toBe('tsx');
  });

  it('should return correct language for JSX files', () => {
    expect(getLanguageFromPath('src/App.jsx')).toBe('jsx');
    expect(getLanguageFromPath('src/App.tsx')).toBe('tsx');
  });

  it('should return correct language for CSS files', () => {
    expect(getLanguageFromPath('styles/main.css')).toBe('css');
    expect(getLanguageFromPath('styles/main.scss')).toBe('scss');
    expect(getLanguageFromPath('styles/main.sass')).toBe('sass');
    expect(getLanguageFromPath('styles/main.less')).toBe('less');
  });

  it('should return correct language for data format files', () => {
    expect(getLanguageFromPath('config.json')).toBe('json');
    expect(getLanguageFromPath('config.yaml')).toBe('yaml');
    expect(getLanguageFromPath('config.yml')).toBe('yaml');
    expect(getLanguageFromPath('config.toml')).toBe('toml');
    expect(getLanguageFromPath('data.xml')).toBe('xml');
  });

  it('should return correct language for shell scripts', () => {
    expect(getLanguageFromPath('script.sh')).toBe('bash');
    expect(getLanguageFromPath('script.bash')).toBe('bash');
    expect(getLanguageFromPath('script.zsh')).toBe('bash');
  });

  it('should return correct language for backend languages', () => {
    expect(getLanguageFromPath('main.py')).toBe('python');
    expect(getLanguageFromPath('main.rb')).toBe('ruby');
    expect(getLanguageFromPath('main.go')).toBe('go');
    expect(getLanguageFromPath('main.rs')).toBe('rust');
    expect(getLanguageFromPath('Main.java')).toBe('java');
    expect(getLanguageFromPath('main.php')).toBe('php');
    expect(getLanguageFromPath('main.c')).toBe('c');
    expect(getLanguageFromPath('main.cpp')).toBe('cpp');
  });

  it('should return correct language for markup files', () => {
    expect(getLanguageFromPath('README.md')).toBe('markdown');
    expect(getLanguageFromPath('docs/guide.mdx')).toBe('mdx');
  });

  it('should handle special filenames', () => {
    expect(getLanguageFromPath('Dockerfile')).toBe('dockerfile');
    expect(getLanguageFromPath('Makefile')).toBe('makefile');
    expect(getLanguageFromPath('.env')).toBe('dotenv');
    expect(getLanguageFromPath('.env.local')).toBe('dotenv');
  });

  it('should return null for unknown extensions', () => {
    expect(getLanguageFromPath('file.unknown')).toBeNull();
    expect(getLanguageFromPath('file.xyz')).toBeNull();
  });

  it('should return null for files without extension', () => {
    expect(getLanguageFromPath('LICENSE')).toBeNull();
    expect(getLanguageFromPath('CHANGELOG')).toBeNull();
  });

  it('should handle nested paths correctly', () => {
    expect(getLanguageFromPath('src/components/Button/Button.tsx')).toBe('tsx');
    expect(getLanguageFromPath('very/deep/nested/path/to/file.py')).toBe('python');
  });

  it('should be case insensitive for extensions', () => {
    expect(getLanguageFromPath('README.MD')).toBe('markdown');
    expect(getLanguageFromPath('script.SH')).toBe('bash');
    expect(getLanguageFromPath('data.JSON')).toBe('json');
  });
});
