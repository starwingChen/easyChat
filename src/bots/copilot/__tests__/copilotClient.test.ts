import { describe, expect, it, vi } from 'vitest';

import { CopilotClientError, createCopilotClient } from '../copilotClient';

type Listener = (event: unknown) => void;

class FakeWebSocket {
  readonly sentMessages: string[] = [];

  private readonly listeners = new Map<string, Listener[]>();

  constructor(public readonly url: string) {}

  addEventListener(type: string, listener: Listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: Listener) {
    const listeners = this.listeners.get(type) ?? [];
    this.listeners.set(
      type,
      listeners.filter((candidate) => candidate !== listener),
    );
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.emit('close', { code: 1000 });
  }

  emitOpen() {
    this.emit('open', {});
  }

  emitMessage(data: unknown) {
    this.emit('message', { data: JSON.stringify(data) });
  }

  emitRawMessage(data: string) {
    this.emit('message', { data });
  }

  emitClose(event: { code?: number } = {}) {
    this.emit('close', { code: event.code ?? 1006 });
  }

  private emit(type: string, event: unknown) {
    (this.listeners.get(type) ?? []).forEach((listener) => listener(event));
  }
}

describe('copilotClient', () => {
  it('creates a conversation by posting the documented empty payload', async () => {
    const postConversation = vi.fn().mockResolvedValue({ id: 'conversation-1' });
    const client = createCopilotClient({
      postConversation,
      createWebSocket: () => {
        throw new Error('socket should not be created');
      },
      createClientSessionId: () => 'session-id',
    });

    await expect(client.createConversation()).resolves.toEqual({
      conversationId: 'conversation-1',
    });
    expect(postConversation).toHaveBeenCalledWith({}, { credentials: 'include' });
  });

  it('opens a websocket, sends the documented payload, and concatenates appendText events until done', async () => {
    const socket = new FakeWebSocket('ignored');
    const createWebSocket = vi.fn((url: string) => {
      expect(url).toBe(
        'wss://copilot.microsoft.com/c/api/chat?api-version=2&clientSessionId=client-session-1',
      );

      return socket as unknown as WebSocket;
    });
    const client = createCopilotClient({
      postConversation: vi.fn(),
      createClientSessionId: () => 'client-session-1',
      createWebSocket,
    });

    const pendingResult = client.sendMessage({
      conversationId: 'conversation-1',
      prompt: '你好',
    });

    expect(createWebSocket).toHaveBeenCalledTimes(1);

    socket.emitOpen();

    expect(socket.sentMessages).toHaveLength(1);
    expect(JSON.parse(socket.sentMessages[0])).toEqual({
      event: 'send',
      conversationId: 'conversation-1',
      content: [
        {
          type: 'text',
          text: '你好',
        },
      ],
      mode: 'smart',
      context: {},
    });

    socket.emitMessage({
      event: 'appendText',
      messageId: 'message-1',
      partId: 'part-1',
      text: '你',
      id: '1',
    });
    socket.emitMessage({
      event: 'appendText',
      messageId: 'message-1',
      partId: 'part-1',
      text: '好',
      id: '2',
    });
    socket.emitMessage({
      event: 'done',
      messageId: 'message-1',
      id: '3',
    });

    await expect(pendingResult).resolves.toEqual({
      conversationId: 'conversation-1',
      text: '你好',
    });
  });

  it('throws a structured error when the socket closes before done', async () => {
    const socket = new FakeWebSocket('ignored');
    const client = createCopilotClient({
      postConversation: vi.fn(),
      createClientSessionId: () => 'client-session-1',
      createWebSocket: () => socket as unknown as WebSocket,
    });

    const pendingResult = client.sendMessage({
      conversationId: 'conversation-1',
      prompt: '你好',
    });

    socket.emitOpen();
    socket.emitMessage({
      event: 'appendText',
      text: '你',
    });
    socket.emitClose({ code: 1006 });

    await expect(pendingResult).rejects.toEqual(
      new CopilotClientError('socketClosedBeforeDone', 'Copilot socket closed before done event.'),
    );
  });

  it('throws a structured error when done arrives without any accumulated text', async () => {
    const socket = new FakeWebSocket('ignored');
    const client = createCopilotClient({
      postConversation: vi.fn(),
      createClientSessionId: () => 'client-session-1',
      createWebSocket: () => socket as unknown as WebSocket,
    });

    const pendingResult = client.sendMessage({
      conversationId: 'conversation-1',
      prompt: '你好',
    });

    socket.emitOpen();
    socket.emitMessage({
      event: 'done',
      messageId: 'message-1',
      id: '3',
    });

    await expect(pendingResult).rejects.toEqual(
      new CopilotClientError('emptyResponse', 'Copilot returned an empty response.'),
    );
  });
});
