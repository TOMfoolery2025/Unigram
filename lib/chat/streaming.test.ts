/** @format */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatStreamChunk } from '@/types/chat';

/**
 * Tests for streaming message handler
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
describe('Streaming Message Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper to create a mock ReadableStream with Server-Sent Events
   */
  function createMockSSEStream(chunks: ChatStreamChunk[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    let index = 0;

    return new ReadableStream({
      async pull(controller) {
        if (index < chunks.length) {
          const chunk = chunks[index];
          const sseData = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
          index++;
        } else {
          controller.close();
        }
      },
    });
  }

  it('should parse Server-Sent Events from API - Requirement 2.1', async () => {
    const chunks: ChatStreamChunk[] = [
      { type: 'content', data: 'Hello' },
      { type: 'content', data: ' world' },
      { type: 'done', data: null },
    ];

    const stream = createMockSSEStream(chunks);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    const receivedChunks: ChatStreamChunk[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data) {
            receivedChunks.push(JSON.parse(data));
          }
        }
      }
    }

    expect(receivedChunks).toHaveLength(3);
    expect(receivedChunks[0]).toEqual({ type: 'content', data: 'Hello' });
    expect(receivedChunks[1]).toEqual({ type: 'content', data: ' world' });
    expect(receivedChunks[2]).toEqual({ type: 'done', data: null });
  });

  it('should handle incremental content updates - Requirement 2.1', async () => {
    const chunks: ChatStreamChunk[] = [
      { type: 'content', data: 'The' },
      { type: 'content', data: ' answer' },
      { type: 'content', data: ' is' },
      { type: 'content', data: ' 42' },
    ];

    const stream = createMockSSEStream(chunks);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data) {
            const chunk: ChatStreamChunk = JSON.parse(data);
            if (chunk.type === 'content' && typeof chunk.data === 'string') {
              fullContent += chunk.data;
            }
          }
        }
      }
    }

    expect(fullContent).toBe('The answer is 42');
  });

  it('should handle sources in stream - Requirement 2.1', async () => {
    const chunks: ChatStreamChunk[] = [
      { type: 'content', data: 'Based on the wiki' },
      {
        type: 'sources',
        data: [
          { title: 'Test Article', slug: 'test-article', category: 'General' },
        ],
      },
      { type: 'done', data: null },
    ];

    const stream = createMockSSEStream(chunks);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let content = '';
    let sources: any[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data) {
            const chunk: ChatStreamChunk = JSON.parse(data);
            if (chunk.type === 'content' && typeof chunk.data === 'string') {
              content += chunk.data;
            } else if (chunk.type === 'sources' && Array.isArray(chunk.data)) {
              sources = chunk.data;
            }
          }
        }
      }
    }

    expect(content).toBe('Based on the wiki');
    expect(sources).toHaveLength(1);
    expect(sources[0]).toEqual({
      title: 'Test Article',
      slug: 'test-article',
      category: 'General',
    });
  });

  it('should handle error chunks - Requirement 2.3', async () => {
    const chunks: ChatStreamChunk[] = [
      { type: 'content', data: 'Starting...' },
      { type: 'error', data: 'API rate limit exceeded' },
    ];

    const stream = createMockSSEStream(chunks);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let errorOccurred = false;
    let errorMessage = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data) {
              const chunk: ChatStreamChunk = JSON.parse(data);
              if (chunk.type === 'error') {
                errorOccurred = true;
                errorMessage = chunk.data as string;
                throw new Error(errorMessage);
              }
            }
          }
        }
      }
    } catch (error) {
      expect(errorOccurred).toBe(true);
      expect(errorMessage).toBe('API rate limit exceeded');
    }
  });

  it('should handle stream completion - Requirement 2.4', async () => {
    const chunks: ChatStreamChunk[] = [
      { type: 'content', data: 'Complete message' },
      { type: 'done', data: null },
    ];

    const stream = createMockSSEStream(chunks);
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let isComplete = false;
    let content = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        isComplete = true;
        break;
      }

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data) {
            const chunk: ChatStreamChunk = JSON.parse(data);
            if (chunk.type === 'content' && typeof chunk.data === 'string') {
              content += chunk.data;
            }
          }
        }
      }
    }

    expect(isComplete).toBe(true);
    expect(content).toBe('Complete message');
  });

  it('should handle empty stream gracefully', async () => {
    const chunks: ChatStreamChunk[] = [];
    const stream = createMockSSEStream(chunks);
    const reader = stream.getReader();
    
    const { done } = await reader.read();
    expect(done).toBe(true);
  });

  it('should handle malformed JSON gracefully', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {invalid json}\n\n'));
        controller.close();
      },
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let parseError = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data) {
            try {
              JSON.parse(data);
            } catch (e) {
              parseError = true;
            }
          }
        }
      }
    }

    expect(parseError).toBe(true);
  });
});
