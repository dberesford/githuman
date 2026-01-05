/**
 * Single todo item component with drag-and-drop support (desktop + mobile)
 */
import { useState, useRef, useEffect, type DragEvent, type TouchEvent, type KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';
import type { Todo } from '../../../shared/types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
  disabled?: boolean;
  draggable?: boolean;
  onDragStart?: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd?: (e: DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>, id: string) => void;
  isDragOver?: boolean;
  // Touch events for mobile
  onTouchStart?: (e: TouchEvent<HTMLDivElement>, id: string) => void;
  onTouchMove?: (e: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: (e: TouchEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
}

export function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
  disabled,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragEnd,
  onDrop,
  isDragOver,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  isDragging,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(todo.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end instead of selecting all
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (!disabled && onEdit) {
      setEditContent(todo.content);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== todo.content) {
      onEdit?.(todo.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(todo.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div
      data-testid={`todo-item-${todo.id}`}
      data-todo-id={todo.id}
      draggable={draggable && !disabled}
      onDragStart={(e) => onDragStart?.(e, todo.id)}
      onDragOver={onDragOver}
      onDragEnter={(e) => onDragEnter?.(e, todo.id)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop?.(e, todo.id)}
      className={cn(
        'group flex items-start gap-2 p-2 rounded-lg transition-colors',
        'hover:bg-[var(--gh-bg-elevated)]',
        todo.completed && 'opacity-60',
        draggable && !disabled && 'cursor-grab active:cursor-grabbing select-none',
        isDragOver && 'border-t-2 border-[var(--gh-accent-primary)]',
        isDragging && 'opacity-50 bg-[var(--gh-accent-primary)]/10'
      )}
    >
      {/* Drag handle - touch events only on handle for mobile */}
      {draggable && (
        <div
          className={cn(
            'mt-0.5 w-6 h-6 flex-shrink-0 flex items-center justify-center text-[var(--gh-text-muted)] touch-none',
            disabled && 'opacity-50'
          )}
          aria-label="Drag to reorder"
          onTouchStart={(e) => onTouchStart?.(e, todo.id)}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>
      )}
      <button
        onClick={() => onToggle(todo.id)}
        disabled={disabled}
        className={cn(
          'mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[var(--gh-accent-primary)] focus:ring-offset-1 focus:ring-offset-[var(--gh-bg-secondary)]',
          todo.completed
            ? 'bg-[var(--gh-success)] border-[var(--gh-success)] text-[var(--gh-bg-primary)]'
            : 'border-[var(--gh-border)] hover:border-[var(--gh-accent-primary)]',
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
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 text-base bg-[var(--gh-bg-elevated)] text-[var(--gh-text-primary)] px-2 py-0.5 rounded border border-[var(--gh-accent-primary)] outline-none"
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          className={cn(
            'flex-1 text-sm break-words text-[var(--gh-text-primary)]',
            todo.completed && 'line-through text-[var(--gh-text-muted)]',
            onEdit && !disabled && 'cursor-text'
          )}
          title={onEdit && !disabled ? 'Double-click to edit' : undefined}
        >
          {todo.content}
        </span>
      )}
      <button
        onClick={() => onDelete(todo.id)}
        disabled={disabled}
        className={cn(
          'opacity-0 group-hover:opacity-100 p-1 text-[var(--gh-text-muted)] hover:text-[var(--gh-error)] rounded transition-all',
          'focus:outline-none focus:opacity-100 focus:ring-2 focus:ring-[var(--gh-error)]',
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
