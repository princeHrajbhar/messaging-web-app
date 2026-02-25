

import type * as conversations from "../conversations.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  conversations: typeof conversations;
  http: typeof http;
  messages: typeof messages;
  users: typeof users;
}>;


export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;


export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
