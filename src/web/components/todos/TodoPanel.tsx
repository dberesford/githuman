/**
 * Todo panel component - main container for todo list
 */
import { useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { TodoItem } from './TodoItem';
import { TodoInput } from './TodoInput';
import {
  useTodos,
  useTodoStats,
  useCreateTodo,
  useToggleTodo,
  useDeleteTodo,
  useClearCompleted,
} from '../../hooks/useTodos';

type FilterState = 'all' | 'pending' | 'completed';

interface TodoPanelProps {
  reviewId?: string;
  className?: string;
}

export function TodoPanel({ reviewId, className }: TodoPanelProps) {
  const [filter, setFilter] = useState<FilterState>('all');

  const filters = filter === 'all'
    ? { reviewId }
    : { reviewId, completed: filter === 'completed' };

  const { todos, loading, refetch } = useTodos(filters);
  const { stats, refetch: refetchStats } = useTodoStats();
  const { create, loading: creating } = useCreateTodo();
  const { toggle, loading: toggling } = useToggleTodo();
  const { deleteTodo, loading: deleting } = useDeleteTodo();
  const { clearCompleted, loading: clearing } = useClearCompleted();

  const isDisabled = creating || toggling || deleting || clearing;

  const handleAdd = useCallback(async (content: string) => {
    await create({ content, reviewId });
    refetch();
    refetchStats();
  }, [create, reviewId, refetch, refetchStats]);

  const handleToggle = useCallback(async (id: string) => {
    await toggle(id);
    refetch();
    refetchStats();
  }, [toggle, refetch, refetchStats]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteTodo(id);
    refetch();
    refetchStats();
  }, [deleteTodo, refetch, refetchStats]);

  const handleClearCompleted = useCallback(async () => {
    await clearCompleted();
    refetch();
    refetchStats();
  }, [clearCompleted, refetch, refetchStats]);

  const filterButtons: { value: FilterState; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Done' },
  ];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-700">
            Todos
            {stats && (
              <span className="ml-1 text-gray-400">
                ({stats.pending} pending)
              </span>
            )}
          </h2>
          {stats && stats.completed > 0 && (
            <button
              onClick={handleClearCompleted}
              disabled={isDisabled}
              className={cn(
                'text-xs text-gray-500 hover:text-red-600',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              Clear done
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={cn(
                'px-2 py-1 text-xs rounded',
                filter === btn.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add input */}
      <div className="p-3 border-b border-gray-200">
        <TodoInput onAdd={handleAdd} disabled={isDisabled} />
      </div>

      {/* Todo list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="text-sm text-gray-500 px-2">Loading...</p>
        ) : todos.length === 0 ? (
          <p className="text-sm text-gray-500 px-2">
            {filter === 'all' ? 'No todos yet' : `No ${filter} todos`}
          </p>
        ) : (
          <div className="space-y-1">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
                disabled={isDisabled}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      {stats && stats.total > 0 && (
        <div className="p-2 border-t border-gray-200 text-xs text-gray-400">
          {stats.completed}/{stats.total} completed
        </div>
      )}
    </div>
  );
}
