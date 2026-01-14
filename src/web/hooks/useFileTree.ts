import { useState, useEffect, useCallback, useMemo } from 'react'
import { gitApi } from '../api/git'
import type { FileTreeNode, FileTreeResponse } from '../../shared/types'

/**
 * Build a tree structure from a flat list of file paths
 */
export function buildTree (files: string[], changedFiles: Set<string>): FileTreeNode[] {
  const root: FileTreeNode[] = []

  for (const filePath of files) {
    const parts = filePath.split('/')
    let currentLevel = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      const currentPath = parts.slice(0, i + 1).join('/')

      // Look for existing node at this level
      let existingNode = currentLevel.find(n => n.name === part)

      if (!existingNode) {
        const newNode: FileTreeNode = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'directory',
          isChanged: isFile ? changedFiles.has(filePath) : false,
          children: isFile ? undefined : [],
        }
        currentLevel.push(newNode)
        existingNode = newNode
      }

      if (!isFile && existingNode.children) {
        currentLevel = existingNode.children
      }
    }
  }

  // Sort tree: directories first, then alphabetically
  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    }).map(node => ({
      ...node,
      children: node.children ? sortNodes(node.children) : undefined,
    }))
  }

  return sortNodes(root)
}

/**
 * Filter tree nodes by search query
 */
export function filterTree (nodes: FileTreeNode[], query: string): FileTreeNode[] {
  if (!query.trim()) return nodes

  const lowerQuery = query.toLowerCase()

  const filterNode = (node: FileTreeNode): FileTreeNode | null => {
    if (node.type === 'file') {
      // Include file if path matches
      if (node.path.toLowerCase().includes(lowerQuery)) {
        return node
      }
      return null
    }

    // For directories, filter children
    const filteredChildren = node.children
      ?.map(filterNode)
      .filter((n): n is FileTreeNode => n !== null)

    if (filteredChildren && filteredChildren.length > 0) {
      return { ...node, children: filteredChildren }
    }

    // Also include directory if its name matches
    if (node.name.toLowerCase().includes(lowerQuery)) {
      return node
    }

    return null
  }

  return nodes.map(filterNode).filter((n): n is FileTreeNode => n !== null)
}

interface UseFileTreeResult {
  data: FileTreeResponse | null;
  tree: FileTreeNode[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFileTree (ref: string, changedFilePaths: string[]): UseFileTreeResult {
  const [data, setData] = useState<FileTreeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const changedSet = useMemo(() => new Set(changedFilePaths), [changedFilePaths])

  const tree = useMemo(() => {
    if (!data) return []
    return buildTree(data.files, changedSet)
  }, [data, changedSet])

  const fetchData = useCallback(async () => {
    if (!ref) return

    setLoading(true)
    setError(null)
    try {
      const result = await gitApi.getFileTree(ref)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch file tree'))
    } finally {
      setLoading(false)
    }
  }, [ref])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, tree, loading, error, refetch: fetchData }
}

interface UseFileContentResult {
  content: string | null;
  lines: string[];
  isBinary: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFileContent (filePath: string | null, ref: string): UseFileContentResult {
  const [content, setContent] = useState<string | null>(null)
  const [lines, setLines] = useState<string[]>([])
  const [isBinary, setIsBinary] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!filePath || !ref) {
      setContent(null)
      setLines([])
      setIsBinary(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await gitApi.getFileContent(filePath, ref)
      setContent(result.content)
      setLines(result.lines)
      setIsBinary(result.isBinary)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch file content'))
      setContent(null)
      setLines([])
    } finally {
      setLoading(false)
    }
  }, [filePath, ref])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { content, lines, isBinary, loading, error, refetch: fetchData }
}
