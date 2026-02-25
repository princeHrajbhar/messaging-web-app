"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ArrowLeft, Send, ChevronDown, Users, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  conversationId: Id<"conversations">;
  myUserId: Id<"users">;
  onBack: () => void;
}

export function ChatWindow({ conversationId, myUserId, onBack }: Props) {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);

  const conversation = useQuery(api.conversations.getConversation, { conversationId });
  const messages = useQuery(api.messages.getMessages, { conversationId });
  const typingUsers = useQuery(api.messages.getTypingUsers, { conversationId, currentUserId: myUserId });

  const sendMessage = useMutation(api.messages.sendMessage);
  const setTypingMutation = useMutation(api.messages.setTyping);
  const markAsRead = useMutation(api.messages.markAsRead);

  // Mark as read when opening conversation
  useEffect(() => {
    markAsRead({ conversationId, userId: myUserId });
  }, [conversationId, myUserId, markAsRead]);

  // Track if user is near bottom
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isNearBottomRef.current = distanceFromBottom < 100;
    setShowScrollBtn(distanceFromBottom > 200);
    if (isNearBottomRef.current) {
      setHasNewMessages(false);
    }
  }, []);

  // Auto-scroll or show new messages button
  useEffect(() => {
    if (!messages) return;
    const newCount = messages.length;
    const prevCount = prevMessageCountRef.current;

    if (newCount > prevCount) {
      if (isNearBottomRef.current || prevCount === 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: prevCount === 0 ? "instant" : "smooth" });
        setHasNewMessages(false);
      } else {
        setHasNewMessages(true);
      }
    }
    prevMessageCountRef.current = newCount;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessages(false);
    setShowScrollBtn(false);
  };

  // Typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      setTypingMutation({ conversationId, userId: myUserId, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingMutation({ conversationId, userId: myUserId, isTyping: false });
    }, 2000);
  };

  const handleSend = async () => {
    const content = messageText.trim();
    if (!content || isSending) return;

    setMessageText("");
    setIsTyping(false);
    setSendError(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingMutation({ conversationId, userId: myUserId, isTyping: false });

    setIsSending(true);
    try {
      await sendMessage({ conversationId, senderId: myUserId, content });
      markAsRead({ conversationId, userId: myUserId });
    } catch (e) {
      setSendError(true);
      setMessageText(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherUser = conversation?.participants?.find((p: any) => p?._id !== myUserId);
  const displayName = conversation?.isGroup ? conversation.groupName : otherUser?.name || "Chat";
  const isOnline = !conversation?.isGroup && otherUser?.isOnline;
  const memberCount = conversation?.participants?.length;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
        <button
          onClick={onBack}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors -ml-1"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="relative">
          {conversation?.isGroup ? (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          ) : (
            <>
              <img
                src={otherUser?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${otherUser?.name}`}
                alt={displayName || ""}
                className="w-10 h-10 rounded-full object-cover"
              />
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              )}
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">{displayName}</h2>
          {conversation?.isGroup ? (
            <p className="text-xs text-gray-400">{memberCount} members</p>
          ) : (
            <p className={cn("text-xs", isOnline ? "text-green-500" : "text-gray-400")}>
              {isOnline ? "Online" : "Offline"}
            </p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-1"
      >
        {messages === undefined ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mb-3">
              <Send className="w-7 h-7 text-sky-400" />
            </div>
            <p className="text-gray-500 font-medium">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Be the first to say hello! 👋</p>
          </div>
        ) : (
          <>
            {messages.map((msg: any, idx: number) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                isOwn={msg.senderId === myUserId}
                myUserId={myUserId}
                showAvatar={
                  !conversation?.isGroup
                    ? false
                    : idx === 0 || messages[idx - 1]?.senderId !== msg.senderId
                }
                showName={
                  !!conversation?.isGroup &&
                  (idx === 0 || messages[idx - 1]?.senderId !== msg.senderId)
                }
              />
            ))}
          </>
        )}

        {/* Typing indicator */}
        {typingUsers && typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {(showScrollBtn || hasNewMessages) && (
        <div className="absolute bottom-24 right-6">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1.5 bg-sky-500 text-white text-xs font-medium px-3 py-2 rounded-full shadow-lg hover:bg-sky-600 transition-all animate-slide-up"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            {hasNewMessages ? "New messages" : "Scroll down"}
          </button>
        </div>
      )}

      {/* Error state */}
      {sendError && (
        <div className="mx-4 mb-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
          <span className="text-red-500 text-sm flex-1">Failed to send message</span>
          <button
            onClick={() => { setSendError(false); handleSend(); }}
            className="text-red-600 text-xs font-medium hover:underline"
          >
            Retry
          </button>
          <button onClick={() => setSendError(false)} className="text-red-400 text-xs">✕</button>
        </div>
      )}

      {/* Message input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={messageText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 max-h-32 scrollbar-thin transition-all"
            style={{ minHeight: "42px" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
              messageText.trim() && !isSending
                ? "bg-sky-500 hover:bg-sky-600 text-white shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn("flex gap-3", i % 2 === 0 && "flex-row-reverse")}>
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          <div className={cn("space-y-1", i % 2 === 0 && "items-end flex flex-col")}>
            <div className="h-10 w-48 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
