import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getOrCreateDM = mutation({
  args: {
    myUserId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find existing DM conversation between these two users
    const conversations = await ctx.db.query("conversations").collect();
    const existing = conversations.find(
      (c) =>
        !c.isGroup &&
        c.participantIds.length === 2 &&
        c.participantIds.includes(args.myUserId) &&
        c.participantIds.includes(args.otherUserId)
    );

    if (existing) return existing._id;

    return await ctx.db.insert("conversations", {
      participantIds: [args.myUserId, args.otherUserId],
      isGroup: false,
      createdBy: args.myUserId,
      lastMessageTime: Date.now(),
    });
  },
});

export const createGroupConversation = mutation({
  args: {
    myUserId: v.id("users"),
    memberIds: v.array(v.id("users")),
    groupName: v.string(),
  },
  handler: async (ctx, args) => {
    const allMembers = [args.myUserId, ...args.memberIds];
    return await ctx.db.insert("conversations", {
      participantIds: allMembers,
      isGroup: true,
      groupName: args.groupName,
      createdBy: args.myUserId,
      lastMessageTime: Date.now(),
    });
  },
});

export const getMyConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db.query("conversations").collect();
    const myConvos = conversations.filter((c) =>
      c.participantIds.includes(args.userId)
    );

    // Sort by lastMessageTime desc
    myConvos.sort((a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0));

    // Enrich with user data and last message
    const enriched = await Promise.all(
      myConvos.map(async (convo) => {
        const participants = await Promise.all(
          convo.participantIds.map((id) => ctx.db.get(id))
        );

        let lastMessage = null;
        if (convo.lastMessageId) {
          lastMessage = await ctx.db.get(convo.lastMessageId);
        }

        // Get unread count
        const readReceipt = await ctx.db
          .query("readReceipts")
          .withIndex("by_conversation_user", (q) =>
            q.eq("conversationId", convo._id).eq("userId", args.userId)
          )
          .first();

        const allMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", convo._id)
          )
          .collect();

        let unreadCount = 0;
        if (readReceipt?.lastReadTime) {
          unreadCount = allMessages.filter(
            (m) =>
              m._creationTime > readReceipt.lastReadTime &&
              m.senderId !== args.userId
          ).length;
        } else {
          unreadCount = allMessages.filter(
            (m) => m.senderId !== args.userId
          ).length;
        }

        return {
          ...convo,
          participants: participants.filter(Boolean),
          lastMessage,
          unreadCount,
        };
      })
    );

    return enriched;
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const convo = await ctx.db.get(args.conversationId);
    if (!convo) return null;

    const participants = await Promise.all(
      convo.participantIds.map((id) => ctx.db.get(id))
    );

    return {
      ...convo,
      participants: participants.filter(Boolean),
    };
  },
});
