import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
    try {
        // 🔥 THIS is where HMAC verification happens
        const { topic, shop, payload } = await authenticate.webhook(request);

        console.log("Webhook received:", topic, shop);

        return new Response("OK", { status: 200 });

    } catch (error) {
        console.log("Webhook auth failed:", error);

        // ❗ THIS is important for Shopify check
        return new Response("Unauthorized", { status: 401 });
    }
};