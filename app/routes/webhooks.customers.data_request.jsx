import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { shop, topic } = await authenticate.webhook(request);
    
    console.log(`Received ${topic} webhook for ${shop}`);

    // Payload contains the data request info
    // const payload = await request.json();

    return new Response(null, { status: 200 });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("Error in customers/data_request webhook:", error);
    return new Response("Webhook error", { status: 500 });
  }
};
