/**
 * Single todo item component
 */
import { cn } from '../../lib/utils';
import type { Todo } from '../../../shared/types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

export function TodoItem({ todo, onToggle, onDelete, disabled }: TodoItemProps) {
  return (
    <div
      data-testid={`todo-item-${todo.id}`}
      className={cn(
        'group flex items-start gap-2 p-2 rounded hover:bg-gray-50',
        todo.completed && 'opacity-60'
      )}
    >
      <button
        onClick={() => onToggle(todo.id)}
        disabled={disabled}
        className={cn(
          'mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          todo.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {todo.completed && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span
        className={cn(
          'flex-1 text-sm break-words',
          todo.completed && 'line-through text-gray-500'
        )}
      >
        {todo.content}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        disabled={disabled}
        className={cn(
          'opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded',
          'focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-red-500',
          disabled && 'cursor-not-allowed'
        )}
        aria-label="Delete todo"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
