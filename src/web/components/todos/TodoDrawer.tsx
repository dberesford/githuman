/**
 * Todo drawer component - slide-out panel for todos
 */
import { cn } from '../../lib/utils';
import { TodoPanel } from './TodoPanel';

interface TodoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId?: string;
}

export function TodoDrawer({ isOpen, onClose, reviewId }: TodoDrawerProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        data-testid="todo-drawer"
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-xl flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h2 className="font-medium text-gray-900">Todos</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            aria-label="Close todos"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <TodoPanel reviewId={reviewId} className="flex-1" />
      </aside>
    </>
  );
}
