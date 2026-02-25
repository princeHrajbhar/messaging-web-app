import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertUser = internalMutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
        isOnline: false,
        lastSeen: Date.now(),
      });
    }
  },
});

export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
        isOnline: true,
        lastSeen: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
        isOnline: true,
        lastSeen: Date.now(),
      });
    }
  },
});

export const setOnlineStatus = mutation({
  args: {
    clerkId: v.string(),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        isOnline: args.isOnline,
        lastSeen: Date.now(),
      });
    }
  },
});

export const getMyProfile = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const getAllUsers = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    return allUsers.filter((u) => u.clerkId !== args.clerkId);
  },
});

export const searchUsers = query({
  args: { clerkId: v.string(), searchQuery: v.string() },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const filtered = allUsers.filter(
      (u) =>
        u.clerkId !== args.clerkId &&
        u.name.toLowerCase().includes(args.searchQuery.toLowerCase())
    );
    return filtered;
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
