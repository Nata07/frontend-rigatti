export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

