import crypto from "crypto";

export const loader = async () => {
  return new Response("Webhook endpoint is active", { status: 200 });
};

export const action = async ({ request }) => {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");

    if (!hmacHeader) {
      return new Response("Missing HMAC header", { status: 401 });
    }

    const generatedHash = crypto
      .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
      .update(rawBody, "utf-8")
      .digest("base64");

    if (generatedHash !== hmacHeader) {
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("Verified customers/redact webhook");

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Error in customers/redact webhook:", error);
    return new Response("Webhook error", { status: 500 });
  }
};
