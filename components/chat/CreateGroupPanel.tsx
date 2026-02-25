"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { X, Check, Users } from "lucide-react";

interface Props {
  myUserId: Id<"users">;
  myClerkId: string;
  onSelectConversation: (id: Id<"conversations">) => void;
  onClose: () => void;
}

export function CreateGroupPanel({ myUserId, myClerkId, onSelectConversation, onClose }: Props) {
  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [groupName, setGroupName] = useState("");
  const [step, setStep] = useState<"select" | "name">("select");

  const createGroup = useMutation(api.conversations.createGroupConversation);
  const users = useQuery(api.users.getAllUsers, { clerkId: myClerkId });

  const toggleUser = (userId: Id<"users">) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    const conversationId = await createGroup({
      myUserId,
      memberIds: selectedUsers,
      groupName: groupName.trim(),
    });
    onSelectConversation(conversationId);
  };

  return (
    <div className="flex flex-col max-h-96">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
        <h3 className="text-sm font-semibold text-gray-700">New Group Chat</h3>
      </div>

      {step === "select" ? (
        <>
          <div className="flex-1 overflow-y-auto py-1">
            {users?.map((user: any) => (
              <button
                key={user._id}
                onClick={() => toggleUser(user._id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
              >
                <img
                  src={user.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <span className="flex-1 text-sm font-medium text-gray-800">{user.name}</span>
                {selectedUsers.includes(user._id) && (
                  <div className="w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => setStep("name")}
              disabled={selectedUsers.length === 0}
              className="w-full py-2 bg-sky-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-600 transition-colors"
            >
              Next ({selectedUsers.length} selected)
            </button>
          </div>
        </>
      ) : (
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Group Name</label>
            <input
              type="text"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep("select")}
              className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleCreate}
              disabled={!groupName.trim()}
              className="flex-1 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-600 transition-colors"
            >
              Create Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
