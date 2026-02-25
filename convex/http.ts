import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/nextjs/server";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = (await request.json()) as WebhookEvent;

    if (event.type === "user.created" || event.type === "user.updated") {
      const { id, first_name, last_name, email_addresses, image_url } =
        event.data;

      const name =
        [first_name, last_name].filter(Boolean).join(" ") ||
        email_addresses[0]?.email_address?.split("@")[0] ||
        "User";

      await ctx.runMutation(internal.users.upsertUser, {
        clerkId: id,
        name,
        email: email_addresses[0]?.email_address || "",
        imageUrl: image_url || undefined,
      });
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
