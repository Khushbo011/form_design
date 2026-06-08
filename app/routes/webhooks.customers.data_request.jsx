import { authenticate } from "../shopify.server";

export const loader = async () => {
  // Return 200 for GET requests so that automated checks or browser visits don't crash with 405 or 500
  return new Response("Webhook endpoint is active", { status: 200 });
};

export const action = async ({ request }) => {
  try {
    const { shop, topic } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    // Payload has the customer data request
    return new Response(null, { status: 200 });
  } catch (error) {
    if (error instanceof Response) {
      // This means authenticate.webhook threw a Response (e.g., 400 or 401)
      // We must return or throw it so Remix can send it to the client
      return error;
    }
    
    console.error("Error in customers/data_request webhook:", error);
    return new Response("Webhook error", { status: 500 });
  }
};
