import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async () => {
  return new Response("Webhook endpoint is active", { status: 200 });
};

export const action = async ({ request }) => {
  try {
    const { shop, session, topic } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    if (session) {
      await db.session.deleteMany({ where: { shop } });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("Error in app/uninstalled webhook:", error);
    return new Response("Webhook error", { status: 500 });
  }
};
