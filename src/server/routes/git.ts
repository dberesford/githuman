/**
 * Git API routes - repository info, branches, commits
 */
import type { FastifyPluginAsync } from 'fastify';
import { GitService, type BranchInfo, type CommitInfo } from '../services/git.service.ts';
import type { RepositoryInfo } from '../../shared/types.ts';

const gitRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper to get git service
  const getService = () => {
    return new GitService(fastify.config.repositoryPath);
  };

  /**
   * GET /api/git/info
   * Get repository information
   */
  fastify.get<{
    Reply: RepositoryInfo | { error: string };
  }>('/api/git/info', async (request, reply) => {
    const service = getService();

    try {
      const info = await service.getRepositoryInfo();
      return info;
    } catch (err) {
      return reply.code(500).send({
        error: 'Failed to get repository info',
      });
    }
  });

  /**
   * GET /api/git/branches
   * List all branches
   */
  fastify.get<{
    Reply: BranchInfo[];
  }>('/api/git/branches', async () => {
    const service = getService();
    return service.getBranches();
  });

  /**
   * GET /api/git/commits
   * List recent commits
   */
  fastify.get<{
    Querystring: { limit?: string };
    Reply: CommitInfo[];
  }>('/api/git/commits', async (request) => {
    const service = getService();
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20;
    return service.getCommits(limit);
  });

  /**
   * GET /api/git/staged
   * Check if there are staged changes
   */
  fastify.get<{
    Reply: { hasStagedChanges: boolean };
  }>('/api/git/staged', async () => {
    const service = getService();
    const hasStagedChanges = await service.hasStagedChanges();
    return { hasStagedChanges };
  });
};

export default gitRoutes;
