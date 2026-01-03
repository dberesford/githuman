import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface HeaderProps {
  repoName?: string;
  branch?: string;
  onToggleTodos?: () => void;
  todosOpen?: boolean;
  pendingTodos?: number;
}

export function Header({ repoName, branch, onToggleTodos, todosOpen, pendingTodos }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-gray-700">
          GitHuman
        </Link>
        {repoName && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{repoName}</span>
            {branch && (
              <>
                <span className="text-gray-400">/</span>
                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                  {branch}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      <nav className="flex items-center gap-2 sm:gap-4">
        <Link
          to="/staged"
          className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-1.5 rounded hover:bg-gray-100"
        >
          <span className="hidden sm:inline">Staged Changes</span>
          <span className="sm:hidden">Staged</span>
        </Link>
        <Link
          to="/"
          className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-1.5 rounded hover:bg-gray-100"
        >
          Reviews
        </Link>
        {onToggleTodos && (
          <button
            onClick={onToggleTodos}
            className={cn(
              'relative text-xs sm:text-sm text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-1.5 rounded hover:bg-gray-100',
              todosOpen && 'bg-blue-50 text-blue-700'
            )}
            aria-label="Toggle todos"
          >
            <span className="hidden sm:inline">Todos</span>
            <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {pendingTodos !== undefined && pendingTodos > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {pendingTodos > 9 ? '9+' : pendingTodos}
              </span>
            )}
          </button>
        )}
      </nav>
    </header>
  );
}
