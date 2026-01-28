import { useEffect, useMemo } from "react";

import { ChatBody } from "../../../../chat/body";
import { ChatMessageInput } from "../../../../chat/input";
import { ChatSession } from "../../../../chat/session";
import type { HyprUIMessage } from "../../../../../chat/types";
import { useLLMConnectionStatus } from "../../../../../hooks/useLLMConnection";
import * as main from "../../../../../store/tinybase/store/main";
import { id } from "../../../../../utils";

export function AskTab({ sessionId }: { sessionId: string }) {
  const store = main.UI.useStore(main.STORE_ID);
  const { user_id } = main.UI.useValues(main.STORE_ID);
  const title =
    main.UI.useCell("sessions", sessionId, "title", main.STORE_ID) ??
    "Untitled";
  const chatGroupId = useMemo(() => `session-${sessionId}`, [sessionId]);
  const llmStatus = useLLMConnectionStatus();
  const isModelConfigured = llmStatus.status === "success";

  useEffect(() => {
    if (!store || !user_id) {
      return;
    }
    const existing = store.getRow("chat_groups", chatGroupId);
    if (!existing) {
      store.setRow("chat_groups", chatGroupId, {
        user_id,
        created_at: new Date().toISOString(),
        title: `Session: ${title}`,
      });
    }
  }, [store, user_id, chatGroupId, title]);

  return (
    <div className="h-full flex flex-col">
      <ChatSession
        sessionId={`ask-${sessionId}`}
        chatGroupId={chatGroupId}
        attachedSessionId={sessionId}
      >
        {({ messages, sendMessage, regenerate, stop, status, error }) => (
          <>
            <ChatBody
              messages={messages}
              status={status}
              error={error}
              onReload={regenerate}
              isModelConfigured={isModelConfigured}
            />
            <div className="border-t border-neutral-200 bg-neutral-50">
              <ChatMessageInput
                attachedSession={{ id: sessionId, title: String(title) }}
                disabled={
                  isModelConfigured ? status !== "ready" : { disabled: true }
                }
                isStreaming={status === "streaming"}
                onStop={stop}
                onSendMessage={(content, parts) => {
                  const message: HyprUIMessage = {
                    id: id(),
                    role: "user",
                    parts: parts ?? [{ type: "text", text: content }],
                    metadata: {},
                  };
                  sendMessage(message);
                }}
              />
            </div>
          </>
        )}
      </ChatSession>
    </div>
  );
}
