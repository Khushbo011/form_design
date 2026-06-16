/* global process */
/**
 * Public API endpoint for serving published form data to the storefront.
 * 
 * This route is accessed via Shopify App Proxy:
 *   GET /apps/form-design/forms?formId=<uuid>        → Returns single form data
 *   GET /apps/form-design/forms?shop=<shop-domain>   → Returns list of all published forms
 * 
 * App Proxy automatically appends `shop`, `logged_in_customer_id`, `path_prefix`,
 * `timestamp`, and `signature` query parameters.
 * 
 * No admin authentication required — this is a public endpoint.
 */

import prisma from "../db.server";
import { FORM_TEMPLATES } from "../templatesData";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const templateId = url.searchParams.get("templateId") || url.searchParams.get("selectedTemplate");

  console.log("[Storefront API] Incoming request for shop:", shop);
  console.log("[Storefront API: incomingTemplate] Incoming template ID parameter:", templateId);

  // CORS headers for storefront access
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    // ── Single form lookup by Template ID ────────────────────────────────
    if (templateId) {
      const publishedForm = await prisma.publishedForm.findFirst({
        where: {
          shop: shop || undefined,
          templateId: templateId,
        },
        orderBy: { createdAt: "desc" }
      });

      console.log("[Storefront API: matchedPublishedForm] Matched PublishedForm database record:", publishedForm ? { id: publishedForm.id, templateId: publishedForm.templateId } : "None (falling back to default template layout)");

      // Find the template definition to get fields, submitText, etc.
      const template = FORM_TEMPLATES.find((t) => t.id === templateId);

      if (!publishedForm) {
        // Fallback: If no publishedForm exists in database yet for this template, 
        // return the default static template layout directly so it works instantly!
        if (template) {
          console.log("[Storefront API] Serving default static template config for:", templateId);
          return new Response(
            JSON.stringify({
              id: `default-${template.id}`,
              templateId: template.id,
              templateName: template.name,
              fields: template.fields || [],
              submitText: template.submitText || "Submit",
              successMessage: template.successMessage || "Form submitted successfully!",
              design: {},
            }),
            { status: 200, headers }
          );
        }

        return new Response(
          JSON.stringify({ error: "Form template not found", templateId }),
          { status: 404, headers }
        );
      }

      let design = {};
      try {
        design = publishedForm.configData
          ? JSON.parse(publishedForm.configData)
          : {};
      } catch (e) {
        console.error("Failed to parse configData for templateId", templateId, e);
      }

      return new Response(
        JSON.stringify({
          id: publishedForm.id,
          templateId: publishedForm.templateId,
          templateName: publishedForm.templateName,
          fields: template ? template.fields : [],
          submitText: template ? template.submitText : "Submit",
          successMessage: template
            ? template.successMessage
            : "Form submitted successfully!",
          design,
        }),
        { status: 200, headers }
      );
    }

    // ── List all published forms for a shop ─────────────────────────────
    if (shop) {
      const forms = await prisma.publishedForm.findMany({
        where: { shop },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          templateName: true,
          templateId: true,
          createdAt: true,
        },
      });

      return new Response(
        JSON.stringify({ forms }),
        { status: 200, headers }
      );
    }

    // ── No params ──────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        error: "Missing required parameter: shop or formId",
      }),
      { status: 400, headers }
    );
  } catch (err) {
    console.error("Storefront API error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers }
    );
  }
};
