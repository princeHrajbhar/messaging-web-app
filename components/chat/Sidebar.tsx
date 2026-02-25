"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { cn, formatConversationTime } from "@/lib/utils";
import { UserListPanel } from "./UserListPanel";
import { CreateGroupPanel } from "./CreateGroupPanel";
import { Search, Plus, Users, MessageSquare } from "lucide-react";

interface Props {
  myProfile: any;
  selectedConversationId: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
  onNewChat: () => void;
  showUserList: boolean;
  onCloseUserList: () => void;
}

export function Sidebar({
  myProfile,
  selectedConversationId,
  onSelectConversation,
  onNewChat,
  showUserList,
  onCloseUserList,
}: Props) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const conversations = useQuery(
    api.conversations.getMyConversations,
    myProfile ? { userId: myProfile._id } : "skip"
  );

  const filteredConversations = conversations?.filter((c) => {
    if (!searchQuery) return true;
    if (c.isGroup) {
      return c.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    const otherUser = c.participants?.find((p: any) => p?._id !== myProfile?._id);
    return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Tars Chat</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="New conversation"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>

        {/* New chat options */}
        {showNewChat && (
          <div className="mb-3 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 animate-fade-in">
            <button
              onClick={() => { onNewChat(); setShowNewChat(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left"
            >
              <MessageSquare className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-medium text-gray-700">New Direct Message</span>
            </button>
            <div className="h-px bg-gray-200 mx-4" />
            <button
              onClick={() => { setShowCreateGroup(true); setShowNewChat(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left"
            >
              <Users className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-medium text-gray-700">New Group Chat</span>
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all"
          />
        </div>
      </div>

      {/* User list panel (for new DM) */}
      {showUserList && myProfile && user && (
        <div className="border-b border-gray-200 bg-gray-50">
          <UserListPanel
            myUserId={myProfile._id}
            myClerkId={user.id}
            onSelectConversation={(id) => { onSelectConversation(id); onCloseUserList(); }}
            onClose={onCloseUserList}
          />
        </div>
      )}

      {/* Create group panel */}
      {showCreateGroup && myProfile && (
        <div className="border-b border-gray-200 bg-gray-50">
          <CreateGroupPanel
            myUserId={myProfile._id}
            myClerkId={user?.id || ""}
            onSelectConversation={(id) => { onSelectConversation(id); setShowCreateGroup(false); }}
            onClose={() => setShowCreateGroup(false)}
          />
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {conversations === undefined ? (
          <ConversationSkeleton />
        ) : filteredConversations && filteredConversations.length > 0 ? (
          <div className="py-2">
            {filteredConversations.map((convo) => (
              <ConversationItem
                key={convo._id}
                conversation={convo}
                myUserId={myProfile?._id}
                isSelected={selectedConversationId === convo._id}
                onClick={() => onSelectConversation(convo._id)}
              />
            ))}
          </div>
        ) : searchQuery ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Search className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No results for "{searchQuery}"</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No conversations yet</p>
            <p className="text-gray-400 text-sm mt-1">Click + to start a new chat</p>
          </div>
        )}
      </div>

      {/* User profile footer */}
      {myProfile && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center gap-3">
          <div className="relative">
            <img
              src={myProfile.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${myProfile.name}`}
              alt={myProfile.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{myProfile.name}</p>
            <p className="text-xs text-green-500">Active now</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversationItem({
  conversation,
  myUserId,
  isSelected,
  onClick,
}: {
  conversation: any;
  myUserId: any;
  isSelected: boolean;
  onClick: () => void;
}) {
  const otherUser = conversation.isGroup
    ? null
    : conversation.participants?.find((p: any) => p?._id !== myUserId);

  const displayName = conversation.isGroup
    ? conversation.groupName
    : otherUser?.name || "Unknown User";

  const avatarUrl = conversation.isGroup
    ? null
    : otherUser?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${otherUser?.name}`;

  const lastMsg = conversation.lastMessage;
  const previewText = lastMsg
    ? lastMsg.isDeleted
      ? "Message deleted"
      : lastMsg.content.length > 40
      ? lastMsg.content.substring(0, 40) + "..."
      : lastMsg.content
    : "No messages yet";

  const isOnline = !conversation.isGroup && otherUser?.isOnline;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left",
        isSelected && "bg-sky-50 hover:bg-sky-50"
      )}
    >
      <div className="relative flex-shrink-0">
        {conversation.isGroup ? (
          <div className="w-11 h-11 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
        ) : (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-11 h-11 rounded-full object-cover"
          />
        )}
        {isOnline && (
          <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "text-sm font-semibold truncate",
            isSelected ? "text-sky-700" : "text-gray-900"
          )}>
            {displayName}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {conversation.lastMessageTime && (
              <span className="text-xs text-gray-400">
                {formatConversationTime(conversation.lastMessageTime)}
              </span>
            )}
            {conversation.unreadCount > 0 && (
              <span className="bg-sky-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
        <p className={cn(
          "text-xs truncate mt-0.5",
          lastMsg?.isDeleted ? "italic text-gray-400" : "text-gray-500",
          conversation.unreadCount > 0 && "font-medium text-gray-700"
        )}>
          {previewText}
        </p>
      </div>
    </button>
  );
}

function ConversationSkeleton() {
  return (
    <div className="py-2 space-y-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-11 h-11 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-2.5 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
