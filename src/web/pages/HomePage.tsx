import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReviewsList } from '../hooks/useReviews';
import { reviewsApi } from '../api/reviews';
import { cn } from '../lib/utils';
import type { ReviewStatus, ReviewSourceType } from '../../shared/types';

function getStatusBadge(status: ReviewStatus) {
  const styles = {
    in_progress: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    changes_requested: 'bg-red-100 text-red-700',
  };

  const labels = {
    in_progress: 'In Progress',
    approved: 'Approved',
    changes_requested: 'Changes Requested',
  };

  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded', styles[status])}>
      {labels[status]}
    </span>
  );
}

function getSourceLabel(sourceType: ReviewSourceType, sourceRef: string | null) {
  if (sourceType === 'staged') {
    return 'Staged changes';
  }
  if (sourceType === 'branch' && sourceRef) {
    return `Branch: ${sourceRef}`;
  }
  if (sourceType === 'commits' && sourceRef) {
    const commits = sourceRef.split(',');
    if (commits.length === 1) {
      return `Commit: ${commits[0].slice(0, 8)}`;
    }
    return `${commits.length} commits`;
  }
  return 'Unknown';
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HomePage() {
  const { data, loading, error, refetch } = useReviewsList();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await reviewsApi.delete(deleteId);
      setDeleteId(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete review:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Reviews</h1>
          <Link
            to="/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Review
          </Link>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading reviews...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error.message}</p>
          </div>
        )}

        {data && data.data.length === 0 && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700">No reviews yet</p>
            <p className="text-gray-500 mt-1">
              Create a new review from staged changes, branches, or commits.
            </p>
            <Link
              to="/new"
              className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Create New Review
            </Link>
          </div>
        )}

        {data && data.data.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            {data.data.map((review) => (
              <Link
                key={review.id}
                to={`/reviews/${review.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {getSourceLabel(review.sourceType, review.sourceRef)}
                      </span>
                      {getStatusBadge(review.status)}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {review.summary.totalFiles} files
                      </span>
                      <span className="text-green-600">+{review.summary.totalAdditions}</span>
                      <span className="text-red-600">-{review.summary.totalDeletions}</span>
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(review.id, e)}
                    className="ml-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete review"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}

        {data && data.total > data.pageSize && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {data.data.length} of {data.total} reviews
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900">Delete Review</h2>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete this review? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
