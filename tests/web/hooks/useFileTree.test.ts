import { describe, it, expect } from 'vitest'
import { buildTree, filterTree } from '../../../src/web/hooks/useFileTree'
import type { FileTreeNode } from '../../../src/shared/types'

describe('buildTree', () => {
  it('should build nested tree from flat paths', () => {
    const files = ['src/index.ts', 'src/utils/helper.ts', 'package.json']
    const changedFiles = new Set(['src/index.ts'])

    const tree = buildTree(files, changedFiles)

    // Should have 2 top-level items: src folder and package.json
    expect(tree).toHaveLength(2)

    // Directories come first
    const srcFolder = tree[0]
    expect(srcFolder.name).toBe('src')
    expect(srcFolder.type).toBe('directory')
    expect(srcFolder.children).toHaveLength(2) // index.ts and utils folder
  })

  it('should mark changed files', () => {
    const files = ['src/a.ts', 'src/b.ts']
    const changedFiles = new Set(['src/a.ts'])

    const tree = buildTree(files, changedFiles)
    const srcFolder = tree.find(n => n.name === 'src')
    const fileA = srcFolder?.children?.find(n => n.name === 'a.ts')
    const fileB = srcFolder?.children?.find(n => n.name === 'b.ts')

    expect(fileA?.isChanged).toBe(true)
    expect(fileB?.isChanged).toBe(false)
  })

  it('should handle empty file list', () => {
    const tree = buildTree([], new Set())
    expect(tree).toEqual([])
  })

  it('should sort directories before files', () => {
    const files = ['z-file.ts', 'a-folder/index.ts', 'b-file.ts']
    const tree = buildTree(files, new Set())

    // a-folder should come first (directory)
    expect(tree[0].name).toBe('a-folder')
    expect(tree[0].type).toBe('directory')

    // Then files alphabetically
    expect(tree[1].name).toBe('b-file.ts')
    expect(tree[2].name).toBe('z-file.ts')
  })

  it('should sort items alphabetically within directories', () => {
    const files = ['src/z.ts', 'src/a.ts', 'src/m.ts']
    const tree = buildTree(files, new Set())

    const srcFolder = tree[0]
    expect(srcFolder.children?.[0].name).toBe('a.ts')
    expect(srcFolder.children?.[1].name).toBe('m.ts')
    expect(srcFolder.children?.[2].name).toBe('z.ts')
  })

  it('should handle deeply nested paths', () => {
    const files = ['src/components/ui/Button/Button.tsx']
    const tree = buildTree(files, new Set())

    const src = tree[0]
    expect(src.name).toBe('src')
    expect(src.type).toBe('directory')

    const components = src.children?.[0]
    expect(components?.name).toBe('components')
    expect(components?.type).toBe('directory')

    const ui = components?.children?.[0]
    expect(ui?.name).toBe('ui')
    expect(ui?.type).toBe('directory')

    const button = ui?.children?.[0]
    expect(button?.name).toBe('Button')
    expect(button?.type).toBe('directory')

    const file = button?.children?.[0]
    expect(file?.name).toBe('Button.tsx')
    expect(file?.type).toBe('file')
  })

  it('should create correct paths for all nodes', () => {
    const files = ['src/utils/helper.ts']
    const tree = buildTree(files, new Set())

    const src = tree[0]
    expect(src.path).toBe('src')

    const utils = src.children?.[0]
    expect(utils?.path).toBe('src/utils')

    const helper = utils?.children?.[0]
    expect(helper?.path).toBe('src/utils/helper.ts')
  })

  it('should handle files at root level', () => {
    const files = ['package.json', 'tsconfig.json', 'README.md']
    const tree = buildTree(files, new Set())

    expect(tree).toHaveLength(3)
    expect(tree.every(n => n.type === 'file')).toBe(true)
    expect(tree.map(n => n.name)).toEqual(['package.json', 'README.md', 'tsconfig.json'])
  })
})

describe('filterTree', () => {
  const createTestTree = (): FileTreeNode[] => [
    {
      name: 'src',
      path: 'src',
      type: 'directory',
      children: [
        { name: 'index.ts', path: 'src/index.ts', type: 'file' },
        { name: 'utils.ts', path: 'src/utils.ts', type: 'file' },
        {
          name: 'components',
          path: 'src/components',
          type: 'directory',
          children: [
            { name: 'Button.tsx', path: 'src/components/Button.tsx', type: 'file' },
          ],
        },
      ],
    },
    { name: 'package.json', path: 'package.json', type: 'file' },
  ]

  it('should return all nodes for empty query', () => {
    const tree = createTestTree()
    const filtered = filterTree(tree, '')

    expect(filtered).toEqual(tree)
  })

  it('should filter files by name', () => {
    const tree = createTestTree()
    const filtered = filterTree(tree, 'Button')

    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('src')
    expect(filtered[0].children?.[0].name).toBe('components')
    expect(filtered[0].children?.[0].children?.[0].name).toBe('Button.tsx')
  })

  it('should be case insensitive', () => {
    const tree = createTestTree()
    const filtered = filterTree(tree, 'button')

    expect(filtered).toHaveLength(1)
    expect(filtered[0].children?.[0].children?.[0].name).toBe('Button.tsx')
  })

  it('should filter by partial path match', () => {
    const tree = createTestTree()
    const filtered = filterTree(tree, 'components')

    // Should include src folder with components subfolder
    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('src')
    expect(filtered[0].children?.some(c => c.name === 'components')).toBe(true)
  })

  it('should filter root level files', () => {
    const tree = createTestTree()
    const filtered = filterTree(tree, 'package')

    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('package.json')
    expect(filtered[0].type).toBe('file')
  })

  it('should return empty array when nothing matches', () => {
    const tree = createTestTree()
    const filtered = filterTree(tree, 'nonexistent')

    expect(filtered).toHaveLength(0)
  })

  it('should handle whitespace-only query as empty', () => {
    const tree = createTestTree()
    const filtered = filterTree(tree, '   ')

    expect(filtered).toEqual(tree)
  })
})
