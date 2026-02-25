"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Search, X, ArrowLeft } from "lucide-react";

interface Props {
  myUserId: Id<"users">;
  myClerkId: string;
  onSelectConversation: (id: Id<"conversations">) => void;
  onClose: () => void;
}

export function UserListPanel({ myUserId, myClerkId, onSelectConversation, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const getOrCreateDM = useMutation(api.conversations.getOrCreateDM);

  const users = useQuery(
    api.users.searchUsers,
    { clerkId: myClerkId, searchQuery }
  );

  const handleSelectUser = async (userId: Id<"users">) => {
    const conversationId = await getOrCreateDM({
      myUserId,
      otherUserId: userId,
    });
    onSelectConversation(conversationId);
  };

  return (
    <div className="flex flex-col max-h-80">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
        <h3 className="text-sm font-semibold text-gray-700">New Message</h3>
      </div>

      <div className="px-3 py-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full pl-8 pr-3 py-1.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {users === undefined ? (
          <div className="px-4 py-3 text-sm text-gray-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-8 px-4 text-center">
            <Search className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">
              {searchQuery ? `No users found for "${searchQuery}"` : "No other users yet"}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {users.map((user: any) => (
              <button
                key={user._id}
                onClick={() => handleSelectUser(user._id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="relative">
                  <img
                    src={user.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.isOnline ? "Online" : "Offline"}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
