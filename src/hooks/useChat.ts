import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useStreamChat } from "./useStreamChat";
import { getConversation, sendMessage } from "../services/chatService";
import type { ChatMessage, Conversation } from "../types/chat";

export const conversationQueryKey = ["conversation"];

function createOptimisticMessage(content: string): ChatMessage {
  return {
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  };
}

function createFallbackConversation(message: ChatMessage): Conversation {
  const now = message.createdAt;

  return {
    id: "optimistic-conversation",
    userId: "",
    companyId: "",
    createdAt: now,
    updatedAt: now,
    messages: [message],
  };
}

export function useConversation() {
  return useQuery({
    queryKey: conversationQueryKey,
    queryFn: getConversation,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const streamChat = useStreamChat();
  const [error, setError] = useState<unknown>(null);
  const [isFallbackSending, setIsFallbackSending] = useState(false);

  async function mutateAsync(message: string) {
    setError(null);
    await queryClient.cancelQueries({ queryKey: conversationQueryKey });

    const previousConversation = queryClient.getQueryData<Conversation>(conversationQueryKey);
    const optimisticMessage = createOptimisticMessage(message);

    queryClient.setQueryData<Conversation>(
      conversationQueryKey,
      previousConversation
        ? {
            ...previousConversation,
            updatedAt: optimisticMessage.createdAt,
            messages: [...previousConversation.messages, optimisticMessage],
          }
        : createFallbackConversation(optimisticMessage),
    );

    try {
      await streamChat.sendMessage(message, {
        onComplete: async () => {
          const conversation = await queryClient.fetchQuery({
            queryKey: conversationQueryKey,
            queryFn: getConversation,
          });

          queryClient.setQueryData(conversationQueryKey, conversation);
        },
        onFallback: async (fallbackMessage) => {
          setIsFallbackSending(true);
          const result = await sendMessage(fallbackMessage);
          queryClient.setQueryData(conversationQueryKey, result.conversation);
        },
      });
    } catch (caughtError) {
      setError(caughtError);

      if (previousConversation) {
        queryClient.setQueryData(conversationQueryKey, previousConversation);
      } else {
        queryClient.removeQueries({ queryKey: conversationQueryKey, exact: true });
      }

      throw caughtError;
    } finally {
      setIsFallbackSending(false);
    }
  }

  return {
    cancelStream: streamChat.cancelStream,
    error: error ?? streamChat.error,
    isPending: streamChat.isStreaming || isFallbackSending,
    isStreaming: streamChat.isStreaming,
    mutateAsync,
    streamActivities: streamChat.streamActivities,
    streamedContent: streamChat.streamedContent,
  };
}
