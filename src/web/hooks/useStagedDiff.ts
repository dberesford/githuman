import { useState, useEffect, useCallback } from 'react';
import { diffApi, gitApi, type StagedDiffResponse, type UnstagedDiffResponse, type UnstagedFile } from '../api/reviews';

interface UseStagedDiffResult {
  data: StagedDiffResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useStagedDiff(): UseStagedDiffResult {
  const [data, setData] = useState<StagedDiffResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await diffApi.getStaged();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

interface UseUnstagedDiffResult {
  data: UnstagedDiffResponse | null;
  files: UnstagedFile[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUnstagedDiff(): UseUnstagedDiffResult {
  const [data, setData] = useState<UnstagedDiffResponse | null>(null);
  const [files, setFiles] = useState<UnstagedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [diffResult, statusResult] = await Promise.all([
        diffApi.getUnstaged(),
        gitApi.getUnstaged(),
      ]);
      setData(diffResult);
      setFiles(statusResult.files);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, files, loading, error, refetch: fetchData };
}

interface UseGitStagingResult {
  stageFiles: (files: string[]) => Promise<void>;
  stageAll: () => Promise<void>;
  unstageFiles: (files: string[]) => Promise<void>;
  staging: boolean;
  error: Error | null;
}

export function useGitStaging(onSuccess?: () => void): UseGitStagingResult {
  const [staging, setStaging] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const stageFiles = useCallback(async (files: string[]) => {
    setStaging(true);
    setError(null);
    try {
      await gitApi.stageFiles(files);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to stage files'));
      throw err;
    } finally {
      setStaging(false);
    }
  }, [onSuccess]);

  const stageAll = useCallback(async () => {
    setStaging(true);
    setError(null);
    try {
      await gitApi.stageAll();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to stage files'));
      throw err;
    } finally {
      setStaging(false);
    }
  }, [onSuccess]);

  const unstageFiles = useCallback(async (files: string[]) => {
    setStaging(true);
    setError(null);
    try {
      await gitApi.unstageFiles(files);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to unstage files'));
      throw err;
    } finally {
      setStaging(false);
    }
  }, [onSuccess]);

  return { stageFiles, stageAll, unstageFiles, staging, error };
}
