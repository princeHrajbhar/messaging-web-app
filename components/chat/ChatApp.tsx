"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { UserListPanel } from "./UserListPanel";

export function ChatApp() {
  const { user, isLoaded } = useUser();
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");

  const syncUser = useMutation(api.users.syncUser);
  const setOnlineStatus = useMutation(api.users.setOnlineStatus);

  const myProfile = useQuery(
    api.users.getMyProfile,
    user ? { clerkId: user.id } : "skip"
  );

  // Sync user to Convex on load
  useEffect(() => {
    if (user) {
      syncUser({
        clerkId: user.id,
        name: user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || "User",
        email: user.emailAddresses[0]?.emailAddress || "",
        imageUrl: user.imageUrl || undefined,
      });
    }
  }, [user, syncUser]);

  // Online/offline status
  useEffect(() => {
    if (!user) return;

    const handleOnline = () => setOnlineStatus({ clerkId: user.id, isOnline: true });
    const handleOffline = () => setOnlineStatus({ clerkId: user.id, isOnline: false });

    window.addEventListener("focus", handleOnline);
    window.addEventListener("blur", handleOffline);

    return () => {
      window.removeEventListener("focus", handleOnline);
      window.removeEventListener("blur", handleOffline);
      if (user) {
        setOnlineStatus({ clerkId: user.id, isOnline: false });
      }
    };
  }, [user, setOnlineStatus]);

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSelectConversation = (id: Id<"conversations">) => {
    setSelectedConversationId(id);
    setShowUserList(false);
    setMobileView("chat");
  };

  const handleBack = () => {
    setMobileView("sidebar");
    setSelectedConversationId(null);
  };

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      {/* Sidebar - always visible on desktop, conditional on mobile */}
      <div className={`
        ${mobileView === "sidebar" ? "flex" : "hidden"}
        md:flex
        flex-col
        w-full md:w-80 lg:w-96
        bg-white
        border-r border-gray-200
        flex-shrink-0
      `}>
        <Sidebar
          myProfile={myProfile || null}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={() => setShowUserList(true)}
          showUserList={showUserList}
          onCloseUserList={() => setShowUserList(false)}
        />
      </div>

      {/* Chat area */}
      <div className={`
        ${mobileView === "chat" ? "flex" : "hidden"}
        md:flex
        flex-1
        flex-col
        min-w-0
        overflow-hidden
      `}>
        {selectedConversationId && myProfile ? (
          <ChatWindow
            conversationId={selectedConversationId}
            myUserId={myProfile._id}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <div className="text-center p-8 max-w-sm">
              <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Tars Chat</h2>
              <p className="text-gray-500 text-sm">Select a conversation or start a new one to begin messaging.</p>
            </div>
          </div>
        )}
      </div>

      {/* User list panel (modal overlay on mobile, inline on desktop when active) */}
      {showUserList && myProfile && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 md:hidden">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden shadow-2xl">
            <UserListPanel
              myUserId={myProfile._id}
              myClerkId={user?.id || ""}
              onSelectConversation={handleSelectConversation}
              onClose={() => setShowUserList(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
