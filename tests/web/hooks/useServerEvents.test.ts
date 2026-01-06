import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useServerEvents, type EventType } from '../../../src/web/hooks/useServerEvents';
import * as clientModule from '../../../src/web/api/client';

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
    // Simulate connection
    setTimeout(() => {
      this.readyState = 1;
    }, 0);
  }

  close() {
    this.readyState = 2;
  }

  // Helper to simulate receiving a message
  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
    }
  }

  // Helper to simulate an error
  simulateError() {
    if (this.onerror) {
      this.onerror();
    }
  }

  static reset() {
    MockEventSource.instances = [];
  }

  static getLastInstance() {
    return MockEventSource.instances[MockEventSource.instances.length - 1];
  }
}

describe('useServerEvents', () => {
  beforeEach(() => {
    MockEventSource.reset();
    vi.stubGlobal('EventSource', MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should connect to SSE endpoint on mount', () => {
    const onEvent = vi.fn();

    renderHook(() =>
      useServerEvents({
        eventTypes: ['todos'],
        onEvent,
      })
    );

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.getLastInstance().url).toBe('/api/events');
  });

  it('should include auth token in URL when present', () => {
    const onEvent = vi.fn();
    vi.spyOn(clientModule, 'getAuthToken').mockReturnValue('test-token');

    renderHook(() =>
      useServerEvents({
        eventTypes: ['todos'],
        onEvent,
      })
    );

    expect(MockEventSource.getLastInstance().url).toBe('/api/events?token=test-token');
  });

  it('should call onEvent when matching event type is received', async () => {
    const onEvent = vi.fn();

    renderHook(() =>
      useServerEvents({
        eventTypes: ['todos'],
        onEvent,
      })
    );

    const eventSource = MockEventSource.getLastInstance();

    act(() => {
      eventSource.simulateMessage({ type: 'todos', data: { action: 'updated' }, timestamp: Date.now() });
    });

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'todos' })
    );
  });

  it('should not call onEvent for non-matching event type', () => {
    const onEvent = vi.fn();

    renderHook(() =>
      useServerEvents({
        eventTypes: ['todos'],
        onEvent,
      })
    );

    const eventSource = MockEventSource.getLastInstance();

    act(() => {
      eventSource.simulateMessage({ type: 'reviews', data: {}, timestamp: Date.now() });
    });

    expect(onEvent).not.toHaveBeenCalled();
  });

  it('should listen to multiple event types', () => {
    const onEvent = vi.fn();

    renderHook(() =>
      useServerEvents({
        eventTypes: ['todos', 'comments'],
        onEvent,
      })
    );

    const eventSource = MockEventSource.getLastInstance();

    act(() => {
      eventSource.simulateMessage({ type: 'todos', timestamp: Date.now() });
      eventSource.simulateMessage({ type: 'comments', timestamp: Date.now() });
      eventSource.simulateMessage({ type: 'reviews', timestamp: Date.now() });
    });

    expect(onEvent).toHaveBeenCalledTimes(2);
  });

  it('should close connection on unmount', () => {
    const onEvent = vi.fn();

    const { unmount } = renderHook(() =>
      useServerEvents({
        eventTypes: ['todos'],
        onEvent,
      })
    );

    const eventSource = MockEventSource.getLastInstance();
    expect(eventSource.readyState).not.toBe(2);

    unmount();

    expect(eventSource.readyState).toBe(2);
  });

  it('should not connect when enabled is false', () => {
    const onEvent = vi.fn();

    renderHook(() =>
      useServerEvents({
        eventTypes: ['todos'],
        onEvent,
        enabled: false,
      })
    );

    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('should handle malformed messages gracefully', () => {
    const onEvent = vi.fn();

    renderHook(() =>
      useServerEvents({
        eventTypes: ['todos'],
        onEvent,
      })
    );

    const eventSource = MockEventSource.getLastInstance();

    // Simulate invalid JSON - should not throw
    act(() => {
      if (eventSource.onmessage) {
        eventSource.onmessage({ data: 'not valid json' } as MessageEvent);
      }
    });

    expect(onEvent).not.toHaveBeenCalled();
  });

  it('should not reconnect when component re-renders', () => {
    const onEvent = vi.fn();

    const { rerender } = renderHook(
      ({ eventTypes }) =>
        useServerEvents({
          eventTypes,
          onEvent,
        }),
      { initialProps: { eventTypes: ['todos'] as EventType[] } }
    );

    expect(MockEventSource.instances).toHaveLength(1);

    // Re-render with a new array reference (same values)
    rerender({ eventTypes: ['todos'] });

    // Should NOT create a new connection - still just 1
    expect(MockEventSource.instances).toHaveLength(1);

    // Re-render again
    rerender({ eventTypes: ['todos'] });

    // Still just 1 connection
    expect(MockEventSource.instances).toHaveLength(1);
  });

  it('should reconnect after error', async () => {
    vi.useFakeTimers();
    const onEvent = vi.fn();

    const { unmount } = renderHook(() =>
      useServerEvents({
        eventTypes: ['todos'],
        onEvent,
      })
    );

    expect(MockEventSource.instances).toHaveLength(1);

    const eventSource = MockEventSource.getLastInstance();

    // Simulate error
    act(() => {
      eventSource.simulateError();
    });

    // Should have closed the connection
    expect(eventSource.readyState).toBe(2);

    // Fast-forward past reconnect delay (1 second)
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should have created a new connection
    expect(MockEventSource.instances).toHaveLength(2);

    // Should have called onEvent with 'connected' to trigger refetch
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'connected' })
    );

    // Clean up
    unmount();
    vi.useRealTimers();
  });
});
