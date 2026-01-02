/**
 * Todo input component for adding new todos
 */
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';

interface TodoInputProps {
  onAdd: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TodoInput({ onAdd, disabled, placeholder = 'Add a todo...' }: TodoInputProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (trimmed) {
      onAdd(trimmed);
      setContent('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded',
          'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
        )}
      />
      <button
        type="submit"
        disabled={disabled || !content.trim()}
        className={cn(
          'px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded',
          'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          (disabled || !content.trim()) && 'opacity-50 cursor-not-allowed'
        )}
      >
        Add
      </button>
    </form>
  );
}
