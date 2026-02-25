"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { cn, formatMessageTime } from "@/lib/utils";
import { Trash2, Smile } from "lucide-react";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢"];

interface Props {
  message: any;
  isOwn: boolean;
  myUserId: Id<"users">;
  showAvatar?: boolean;
  showName?: boolean;
}

export function MessageBubble({ message, isOwn, myUserId, showAvatar, showName }: Props) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const deleteMessage = useMutation(api.messages.deleteMessage);
  const addReaction = useMutation(api.messages.addReaction);

  const handleDelete = async () => {
    await deleteMessage({ messageId: message._id, userId: myUserId });
    setShowActions(false);
  };

  const handleReaction = async (emoji: string) => {
    await addReaction({ messageId: message._id, userId: myUserId, emoji });
    setShowEmojiPicker(false);
  };

  const myReactions = message.reactions?.flatMap((r: any) =>
    r.userIds.includes(myUserId) ? [r.emoji] : []
  ) || [];

  return (
    <div
      className={cn(
        "flex items-end gap-2 group mb-1",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
    >
      {/* Avatar (for group chats or other users) */}
      {showAvatar !== false && !isOwn && (
        <img
          src={message.sender?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${message.sender?.name}`}
          alt={message.sender?.name}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1"
        />
      )}
      {!isOwn && !showAvatar && <div className="w-7 flex-shrink-0" />}

      <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        {showName && !isOwn && (
          <span className="text-xs text-gray-500 ml-1 mb-0.5 font-medium">{message.sender?.name}</span>
        )}

        <div className="relative">
          {/* Actions bar */}
          {showActions && !message.isDeleted && (
            <div className={cn(
              "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-10",
              isOwn ? "-left-20" : "-right-20"
            )}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <Smile className="w-3.5 h-3.5 text-gray-500" />
              </button>
              {isOwn && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors border border-gray-100"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>
          )}

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className={cn(
              "absolute bottom-full mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 flex gap-1 p-2 z-20",
              isOwn ? "right-0" : "left-0"
            )}>
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={cn(
                    "text-lg hover:bg-gray-100 rounded-lg p-1 transition-colors",
                    myReactions.includes(emoji) && "bg-sky-50"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Bubble */}
          <div
            className={cn(
              "px-3.5 py-2 rounded-2xl text-sm leading-relaxed",
              message.isDeleted
                ? "bg-gray-100 text-gray-400 italic border border-gray-200"
                : isOwn
                ? "bg-sky-500 text-white rounded-br-sm"
                : "bg-gray-100 text-gray-800 rounded-bl-sm"
            )}
          >
            {message.isDeleted ? "This message was deleted" : message.content}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.filter((r: any) => r.userIds.length > 0).map((reaction: any) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors",
                  myReactions.includes(reaction.emoji)
                    ? "bg-sky-50 border-sky-200 text-sky-700"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="font-medium">{reaction.userIds.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 mt-0.5 px-1">
          {formatMessageTime(message._creationTime)}
        </span>
      </div>
    </div>
  );
}
