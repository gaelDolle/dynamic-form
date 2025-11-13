interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ConversationSession {
  messages: Message[];
  lastUpdated: Date;
}

const sessions = new Map<string, ConversationSession>();

export const conversationStorage = {
  getHistory(sessionId: string): Message[] {
    return sessions.get(sessionId)?.messages || [];
  },

  addMessage(sessionId: string, message: Message): void {
    const session = sessions.get(sessionId) || { messages: [], lastUpdated: new Date() };
    session.messages.push(message);
    session.lastUpdated = new Date();
    sessions.set(sessionId, session);
  },

  clearHistory(sessionId: string): void {
    sessions.delete(sessionId);
  },

  cleanup(): void {
    const now = new Date();
    for (const [id, session] of sessions.entries()) {
      const hoursSinceUpdate = (now.getTime() - session.lastUpdated.getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate > 24) {
        sessions.delete(id);
      }
    }
  }
};