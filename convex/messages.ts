import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

const messageId = await ctx.db.insert("messages", {
  conversationId: args.conversationId,
  senderId: args.senderId,
  content: args.content,
  isDeleted: false,
  reactions: [],
  createdAt: now, // ✅ REQUIRED
});

    // Update conversation's last message
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      lastMessageTime: Date.now(),
    });

    // Clear typing indicator for sender
    const typing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.senderId)
      )
      .first();
    if (typing) {
      await ctx.db.delete(typing._id);
    }

    return messageId;
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return { ...msg, sender };
      })
    );

    return enriched;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message || message.senderId !== args.userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.messageId, { isDeleted: true, content: "" });
  },
});

export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const reactions = message.reactions || [];
    const existingReaction = reactions.find((r) => r.emoji === args.emoji);

    if (existingReaction) {
      const userIndex = existingReaction.userIds.indexOf(args.userId);
      if (userIndex > -1) {
        // Remove reaction
        existingReaction.userIds.splice(userIndex, 1);
        if (existingReaction.userIds.length === 0) {
          const filtered = reactions.filter((r) => r.emoji !== args.emoji);
          await ctx.db.patch(args.messageId, { reactions: filtered });
        } else {
          await ctx.db.patch(args.messageId, { reactions });
        }
      } else {
        existingReaction.userIds.push(args.userId);
        await ctx.db.patch(args.messageId, { reactions });
      }
    } else {
      reactions.push({ emoji: args.emoji, userIds: [args.userId] });
      await ctx.db.patch(args.messageId, { reactions });
    }
  },
});

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();

    if (args.isTyping) {
      if (existing) {
        await ctx.db.patch(existing._id, { updatedAt: Date.now() });
      } else {
        await ctx.db.insert("typingIndicators", {
          conversationId: args.conversationId,
          userId: args.userId,
          updatedAt: Date.now(),
        });
      }
    } else if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const now = Date.now();
    const activeTyping = indicators.filter(
      (i) =>
        i.userId !== args.currentUserId && now - i.updatedAt < 3000
    );

    const users = await Promise.all(
      activeTyping.map((i) => ctx.db.get(i.userId))
    );

    return users.filter(Boolean);
  },
});

export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("readReceipts")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastReadTime: Date.now() });
    } else {
      await ctx.db.insert("readReceipts", {
        conversationId: args.conversationId,
        userId: args.userId,
        lastReadTime: Date.now(),
      });
    }
  },
});
