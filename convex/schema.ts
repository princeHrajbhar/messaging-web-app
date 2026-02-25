import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_name", ["name"]),

  conversations: defineTable({
    participantIds: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    lastMessageId: v.optional(v.id("messages")),
    lastMessageTime: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("by_last_message_time", ["lastMessageTime"]),

  messages: defineTable({
  conversationId: v.id("conversations"),
  senderId: v.id("users"),
  content: v.string(),
  isDeleted: v.boolean(),
  createdAt: v.number(), // 👈 ADD THIS
  reactions: v.optional(
    v.array(
      v.object({
        emoji: v.string(),
        userIds: v.array(v.id("users")),
      })
    )
  ),
})
  .index("by_conversation", ["conversationId"])
  .index("by_conversation_time", ["conversationId", "createdAt"]),
  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_user", ["conversationId", "userId"]),

  readReceipts: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastReadMessageId: v.optional(v.id("messages")),
    lastReadTime: v.number(),
  })
    .index("by_conversation_user", ["conversationId", "userId"])
    .index("by_user", ["userId"]),
});
