/**
 * Git API client - file tree and content at ref
 */
import { api } from './client'
import type { FileTreeResponse, FileContentAtRef } from '../../shared/types'

export const gitApi = {
  /**
   * Get list of all files at a git ref
   */
  getFileTree: async (ref: string, options?: { includeWorkingDir?: boolean }): Promise<FileTreeResponse> => {
    const params = new URLSearchParams()
    if (options?.includeWorkingDir) {
      params.set('includeWorkingDir', 'true')
    }
    const query = params.toString()
    return api.get<FileTreeResponse>(`/git/tree/${encodeURIComponent(ref)}${query ? `?${query}` : ''}`)
  },

  /**
   * Get file content at a specific git ref
   */
  getFileContent: async (filePath: string, ref: string): Promise<FileContentAtRef> => {
    return api.get<FileContentAtRef>(`/git/file/${filePath}?ref=${encodeURIComponent(ref)}`)
  },
}
