import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gitApi, reviewsApi, type BranchInfo, type CommitInfo } from '../api/reviews';
import { useCreateReview } from '../hooks/useReviews';
import { cn } from '../lib/utils';

type ReviewSource = 'staged' | 'branch' | 'commits';

export function NewReviewPage() {
  const navigate = useNavigate();
  const { create, loading: creating } = useCreateReview();
  const [source, setSource] = useState<ReviewSource>('staged');
  const [hasStagedChanges, setHasStagedChanges] = useState<boolean | null>(null);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [staged, branchList, commitList] = await Promise.all([
          gitApi.hasStagedChanges(),
          gitApi.getBranches(),
          gitApi.getCommits(50),
        ]);
        setHasStagedChanges(staged.hasStagedChanges);
        setBranches(branchList);
        setCommits(commitList);

        // Default to staged if there are staged changes, otherwise branch
        if (!staged.hasStagedChanges && branchList.length > 0) {
          setSource('branch');
          // Select first non-current branch
          const nonCurrent = branchList.find(b => !b.isCurrent);
          if (nonCurrent) {
            setSelectedBranch(nonCurrent.name);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repository info');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateReview = async () => {
    setCreateError(null);
    try {
      let review;
      if (source === 'staged') {
        review = await create({ sourceType: 'staged' });
      } else if (source === 'branch' && selectedBranch) {
        review = await create({ sourceType: 'branch', sourceRef: selectedBranch });
      } else if (source === 'commits' && selectedCommits.length > 0) {
        review = await create({ sourceType: 'commits', sourceRef: selectedCommits.join(',') });
      } else {
        setCreateError('Please select a source for the review');
        return;
      }
      navigate(`/reviews/${review.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create review');
    }
  };

  const toggleCommit = (sha: string) => {
    setSelectedCommits(prev =>
      prev.includes(sha)
        ? prev.filter(s => s !== sha)
        : [...prev, sha]
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading repository info...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const canCreate =
    (source === 'staged' && hasStagedChanges) ||
    (source === 'branch' && selectedBranch) ||
    (source === 'commits' && selectedCommits.length > 0);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create New Review</h1>

        {createError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{createError}</p>
          </div>
        )}

        {/* Source Selection */}
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
          {/* Staged Changes */}
          <button
            onClick={() => setSource('staged')}
            className={cn(
              'w-full p-4 text-left hover:bg-gray-50 flex items-start gap-4',
              source === 'staged' && 'bg-blue-50 hover:bg-blue-50'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
              source === 'staged' ? 'border-blue-600' : 'border-gray-300'
            )}>
              {source === 'staged' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Staged Changes</div>
              <div className="text-sm text-gray-500 mt-1">
                {hasStagedChanges
                  ? 'Review the currently staged changes in git'
                  : 'No staged changes available'
                }
              </div>
            </div>
            {hasStagedChanges && (
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">
                Available
              </span>
            )}
          </button>

          {/* Branch Comparison */}
          <button
            onClick={() => setSource('branch')}
            className={cn(
              'w-full p-4 text-left hover:bg-gray-50 flex items-start gap-4',
              source === 'branch' && 'bg-blue-50 hover:bg-blue-50'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
              source === 'branch' ? 'border-blue-600' : 'border-gray-300'
            )}>
              {source === 'branch' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Branch Comparison</div>
              <div className="text-sm text-gray-500 mt-1">
                Compare current branch against another branch
              </div>
            </div>
          </button>

          {/* Commits */}
          <button
            onClick={() => setSource('commits')}
            className={cn(
              'w-full p-4 text-left hover:bg-gray-50 flex items-start gap-4',
              source === 'commits' && 'bg-blue-50 hover:bg-blue-50'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
              source === 'commits' ? 'border-blue-600' : 'border-gray-300'
            )}>
              {source === 'commits' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Specific Commits</div>
              <div className="text-sm text-gray-500 mt-1">
                Select one or more commits to review
              </div>
            </div>
          </button>
        </div>

        {/* Branch Selection */}
        {source === 'branch' && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compare against branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a branch...</option>
              {branches.filter(b => !b.isCurrent).map((branch) => (
                <option key={branch.name} value={branch.name}>
                  {branch.name} {branch.isRemote && '(remote)'}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Shows changes from the selected branch to current HEAD
            </p>
          </div>
        )}

        {/* Commit Selection */}
        {source === 'commits' && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Select commits to review
              </label>
              {selectedCommits.length > 0 && (
                <span className="text-xs text-gray-500">
                  {selectedCommits.length} selected
                </span>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {commits.map((commit) => (
                <button
                  key={commit.sha}
                  onClick={() => toggleCommit(commit.sha)}
                  className={cn(
                    'w-full p-3 text-left hover:bg-gray-50 flex items-start gap-3',
                    selectedCommits.includes(commit.sha) && 'bg-blue-50 hover:bg-blue-50'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center mt-0.5',
                    selectedCommits.includes(commit.sha)
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'
                  )}>
                    {selectedCommits.includes(commit.sha) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">{commit.sha.slice(0, 7)}</span>
                      <span className="text-xs text-gray-400">{commit.author}</span>
                    </div>
                    <div className="text-sm text-gray-900 truncate mt-0.5">{commit.message}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateReview}
            disabled={!canCreate || creating}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
