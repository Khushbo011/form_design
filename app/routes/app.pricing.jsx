/* global process */
import {
  useLoaderData,
  useNavigate,
  redirect,
  useFetcher,
  useActionData,
  Form,
} from "react-router";
import { useState, useCallback, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import prisma from "../db.server";
import { authenticate, PLAN_STARTER, PLAN_PRO } from "../shopify.server";

// ---------------------------------------------------------------------------
// LOADER — Check active billing, sync to DB, handle return from Shopify
// ---------------------------------------------------------------------------
export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;

  let activePlan = "free";
  let billingError = null;

  try {
    let isTestEnv = process.env.NODE_ENV !== "production";
    let billingCheck = await billing.check({
      plans: [PLAN_STARTER, PLAN_PRO],
      isTest: isTestEnv,
    });

    if (!billingCheck.hasActivePayment) {
      billingCheck = await billing.check({
        plans: [PLAN_STARTER, PLAN_PRO],
        isTest: true,
      });
    }

    if (
      billingCheck.hasActivePayment &&
      billingCheck.appSubscriptions &&
      billingCheck.appSubscriptions.length > 0
    ) {
      const activeSub = billingCheck.appSubscriptions.find(
        (sub) =>
          sub.status === "ACTIVE" ||
          sub.status === "active" ||
          sub.status === "ACCEPTED"
      );
      if (activeSub) {
        if (activeSub.name === PLAN_PRO) {
          activePlan = "pro";
        } else if (activeSub.name === PLAN_STARTER) {
          activePlan = "starter";
        }
      }
    }
  } catch (err) {
    console.error("Billing check failed:", err?.message || err);
    billingError = "Could not verify your current subscription status.";
  }

  // Persist the plan to the database
  try {
    await prisma.storeSubscription.upsert({
      where: { shop },
      update: {
        plan: activePlan,
        billingStatus: "active",
        email: session.email || "",
        ownerName: session.firstName
          ? `${session.firstName} ${session.lastName || ""}`.trim()
          : "",
      },
      create: {
        shop,
        plan: activePlan,
        billingStatus: "active",
        email: session.email || "",
        ownerName: session.firstName
          ? `${session.firstName} ${session.lastName || ""}`.trim()
          : "",
        shopName: session.shop,
      },
    });
  } catch (dbErr) {
    console.error("DB upsert failed in pricing loader:", dbErr?.message || dbErr);
  }

  // Handle billing callback — user returning from Shopify's approval page
  const url = new URL(request.url);
  const planQuery = url.searchParams.get("plan");

  if (planQuery) {
    const requestedPlan = planQuery.toLowerCase();

    // Check if the plan the user just approved matches what billing.check() reports
    if (
      (requestedPlan === "pro" && activePlan === "pro") ||
      (requestedPlan === "starter" && activePlan === "starter")
    ) {
      // Successfully subscribed — redirect to dashboard
      console.log(`[Billing] Plan "${requestedPlan}" activated for ${shop}. Redirecting to dashboard.`);
      // throw redirect("/app");
      throw redirect(`/app?shop=${shop}`);
    }

    // User cancelled or declined — stay on pricing page with a message
    console.log(`[Billing] Plan "${requestedPlan}" was not activated for ${shop} (cancelled/declined).`);
    return {
      shop,
      plan: activePlan,
      cancelled: true,
      billingError,
    };
  }

  return {
    shop,
    plan: activePlan,
    billingError,
  };
};

// ---------------------------------------------------------------------------
// ACTION — Request billing from Shopify
//
// For paid plans: billing.request() throws a redirect Response which
// React Router returns to the browser. Shopify App Bridge (loaded via
// AppProvider) automatically intercepts redirects to external Shopify
// domains and opens them at the top level — no manual window.open needed.
//
// For free downgrade: cancel active subscriptions and return JSON.
// ---------------------------------------------------------------------------
export const action = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const requestedPlan = formData.get("plan");

  // ── Handle downgrade to free ──────────────────────────────────────────
  if (requestedPlan === "free") {
    try {
      let isTestEnv = process.env.NODE_ENV !== "production";
      let billingCheck = await billing.check({
        plans: [PLAN_STARTER, PLAN_PRO],
        isTest: isTestEnv,
      });

      if (!billingCheck.hasActivePayment) {
        billingCheck = await billing.check({
          plans: [PLAN_STARTER, PLAN_PRO],
          isTest: true,
        });
      }

      if (billingCheck.appSubscriptions) {
        for (const sub of billingCheck.appSubscriptions) {
          if (sub.status === "ACTIVE" || sub.status === "active" || sub.status === "ACCEPTED") {
            await billing.cancel({
              subscriptionId: sub.id,
              isTest: process.env.NODE_ENV !== "production",
              prorate: true,
            });
            console.log(`[Billing] Cancelled subscription "${sub.name}" for ${shop}`);
          }
        }
      }
    } catch (cancelErr) {
      console.error("Error cancelling subscriptions:", cancelErr?.message || cancelErr);
      return { billingError: "Could not cancel existing subscription. Please try again." };
    }

    await prisma.storeSubscription.upsert({
      where: { shop },
      update: { plan: "free", billingStatus: "active" },
      create: {
        shop,
        plan: "free",
        billingStatus: "active",
        email: session.email || "",
        ownerName: session.firstName
          ? `${session.firstName} ${session.lastName || ""}`.trim()
          : "",
        shopName: session.shop,
      },
    });
    return { success: true, redirectTo: "/app" };
  }

  // ── Handle paid plan upgrade ──────────────────────────────────────────
  // Map plan key to plan name constant
  const planName = requestedPlan === "pro" ? PLAN_PRO : PLAN_STARTER;

  // Build return URL — user comes back here after approving/declining
  // For embedded apps, the return URL must point to the embedded app inside the Shopify admin.
  // Otherwise, returning to the app's origin URL at the top level will trigger a redirect to /auth/login.
  const returnUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/app`;

  console.log(`[Billing] Requesting "${planName}" for ${shop}, returnUrl: ${returnUrl}`);

  // billing.request() throws a Response (302 redirect to Shopify's
  // billing approval page). We intentionally DO NOT catch it — letting
  // it propagate through React Router. Shopify App Bridge will
  // prevent the black-screen iframe issue, but since Remix Form uses fetch, 
  // we catch the redirect response and return it to the client.
  try {
    await billing.request({
      plan: planName,
      isTest: process.env.NODE_ENV !== "production",
      returnUrl,
    });
  } catch (error) {
    if (error instanceof Response) {
      const reauthUrl = error.headers.get("X-Shopify-API-Request-Failure-Reauthorize-Url");
      if (reauthUrl) {
        return { billingUrl: reauthUrl };
      }

      const location = error.headers.get("Location");
      if (location) {
        return { billingUrl: location };
      }

      const contentType = error.headers.get("Content-Type") || "";
      if (contentType.includes("text/html")) {
        const text = await error.text();
        const topLocationMatch = text.match(/window\.top\.location\.href\s*=\s*['"]([^'"]+)['"]/);
        if (topLocationMatch && topLocationMatch[1]) {
          return { billingUrl: topLocationMatch[1].replace(/\\\//g, '/') };
        }

        const actionMatch = text.match(/location['"]?\s*:\s*['"]([^'"]+)['"]/);
        if (actionMatch && actionMatch[1]) {
          return { billingUrl: actionMatch[1].replace(/\\\//g, '/') };
        }

        // If parsing fails, return a special flag so the frontend can trigger a full reload
        return { requireFullReload: true };
      }

      // If we don't know how to handle it, return the status
      return { billingError: `Unexpected response status: ${error.status}` };
    }
    throw error;
  }

  // If billing.request() returns normally (shouldn't happen), provide fallback
  return { billingError: "Billing request did not produce a redirect. Please try again." };
};

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------
export default function Pricing() {
  const loaderData = useLoaderData();
  const { plan: currentPlan, cancelled, billingError: loaderBillingError } = loaderData;
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const fetcher = useFetcher();

  const [actionError, setActionError] = useState(null);

  // Handle the top-level redirect for billing upgrade
  const actionData = useActionData();
  useEffect(() => {
    if (actionData?.billingUrl) {
      shopify.toast.show("Redirecting to billing approval...");
      window.open(actionData.billingUrl, "_top");
    } else if (actionData?.requireFullReload) {
      // Fallback: If we couldn't parse the URL, force a full page reload for the form submission
      // so the browser handles the HTML script natively.
      shopify.toast.show("Redirecting...", { isError: false });
      window.top.location.reload();
    }

    if (actionData?.billingError) {
      setActionError(actionData.billingError);
    }
  }, [actionData, shopify]);

  // Track fetcher state for the free downgrade
  const isDowngrading = fetcher.state !== "idle" && fetcher.formData?.get("plan") === "free";

  // Handle fetcher response for free downgrade
  useEffect(() => {
    if (fetcher.data?.success && fetcher.data?.redirectTo) {
      navigate(fetcher.data.redirectTo);
    }
    if (fetcher.data?.billingError) {
      setActionError(fetcher.data.billingError);
      shopify.toast.show(`Billing error: ${fetcher.data.billingError}`, { isError: true });
    }
  }, [fetcher.data, navigate, shopify]);

  const handleDowngradeToFree = useCallback(() => {
    setActionError(null);
    fetcher.submit({ plan: "free" }, { method: "POST" });
  }, [fetcher]);

  const displayError = actionError || loaderBillingError;

  return (
    <s-page heading="Plans & Subscriptions">
      <s-button slot="primary-action" onClick={() => navigate("/app")}>
        Back to Gallery
      </s-button>

      {cancelled && (
        <div
          className="success-banner"
          style={{
            background: "#fef3c7",
            borderColor: "#f59e0b",
            color: "#92400e",
            marginBottom: "16px",
          }}
        >
          <strong>Subscription not changed.</strong> You cancelled or declined
          the billing approval. Your current plan remains active.
        </div>
      )}

      {displayError && (
        <div
          className="success-banner"
          style={{
            background: "#fff4e5",
            borderColor: "#ffb84d",
            color: "#5f3700",
            marginBottom: "16px",
          }}
        >
          <strong>Billing issue:</strong> {displayError}
        </div>
      )}

      <div className="pricing-header">
        <h1>Select a Plan to Unlock Form Design Templates</h1>
        <p>
          Start with our basic features or upgrade to unlock advanced form
          templates and live visual builders.
        </p>
      </div>

      <div className="plans-container" style={{ maxWidth: "800px" }}>
        {/* FREE PLAN */}
        <div
          className={`plan-card ${currentPlan === "free" ? "active-plan" : ""}`}
        >
          {currentPlan === "free" && (
            <span className="plan-badge" style={{ background: "#22c55e" }}>
              Active Plan
            </span>
          )}
          <h2 className="plan-name">Free Plan</h2>
          <div className="plan-price-box" style={{ color: "#22c55e" }}>
            <span className="plan-price">$0</span>
            <span className="plan-period">/ month</span>
          </div>
          <s-paragraph
            style={{ textAlign: "center", color: "#6d7175" }}
            suppressHydrationWarning
          >
            Get started with one free form template.
          </s-paragraph>
          <ul className="plan-features-list">
            <li className="plan-feature-item">
              ✓ <strong>Unlock 4 Template</strong>
            </li>
            <li className="plan-feature-item disabled">
              ✕ Additional Premium Templates
            </li>
            <li className="plan-feature-item disabled">
              ✕ Advanced Builders
            </li>
            <li className="plan-feature-item disabled">
              ✕ Pro Exclusive Forms
            </li>
          </ul>
          <button
            type="button"
            className="plan-btn"
            disabled={isDowngrading || currentPlan === "free"}
            onClick={handleDowngradeToFree}
          >
            {isDowngrading
              ? "Processing..."
              : currentPlan === "free"
                ? "Current Free Plan"
                : "Use Free Plan"}
          </button>
        </div>

        {/* STARTER PLAN — Standard form POST so the redirect propagates */}
        <div
          className={`plan-card ${currentPlan === "starter" ? "active-plan" : ""}`}
        >
          {currentPlan === "starter" && (
            <span
              className="plan-badge"
              style={{ background: "var(--color-starter)" }}
            >
              Active Plan
            </span>
          )}
          <h2 className="plan-name">Starter Plan</h2>
          <div
            className="plan-price-box"
            style={{ color: "var(--color-starter)" }}
          >
            <span className="plan-price">$49</span>
            <span className="plan-period">/ month</span>
          </div>
          <s-paragraph
            style={{ textAlign: "center", color: "#6d7175" }}
            suppressHydrationWarning
          >
            Unlocks selected premium templates and additional customization
            features.
          </s-paragraph>
          <ul className="plan-features-list">
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              <strong>Unlock 4 Templates</strong> (Free + Starter)
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              Customer Feedback & Support Form
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              Job Application & Careers Form
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              Standard Custom Audit Logs Form
            </li>
            <li className="plan-feature-item disabled">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              SaaS Live Builder (Pro Only)
            </li>
            <li className="plan-feature-item disabled">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              5 Exclusive Pro Forms (Pro Only)
            </li>
          </ul>

          {/* Standard form POST — the redirect from billing.request() will
              propagate through React Router. App Bridge intercepts it and
              opens the Shopify billing page at the top level. */}
          <Form method="post" id="starter-plan-form" reloadDocument={actionData?.requireFullReload}>
            <input type="hidden" name="plan" value="starter" />
            <button
              type="submit"
              className="plan-btn starter-btn"
              disabled={currentPlan === "starter"}
            >
              {currentPlan === "starter"
                ? "Active Starter Plan"
                : "Upgrade to Starter"}
            </button>
          </Form>
        </div>

        {/* PRO PLAN — Standard form POST */}
        <div
          className={`plan-card featured ${currentPlan === "pro" ? "active-plan" : ""}`}
        >
          <span
            className="plan-badge"
            style={{ background: "var(--color-pro)" }}
          >
            {currentPlan === "pro" ? "Active Plan" : "Pro Tier"}
          </span>
          <h2 className="plan-name">Pro Plan</h2>
          <div
            className="plan-price-box"
            style={{ color: "var(--color-pro)" }}
          >
            <span className="plan-price">$99</span>
            <span className="plan-period">/ month</span>
          </div>
          <s-paragraph
            style={{ textAlign: "center", color: "#6d7175" }}
            suppressHydrationWarning
          >
            Unlock all templates, advanced builders, and 5 exclusive Pro forms.
          </s-paragraph>
          <ul className="plan-features-list">
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              <strong>Unlock All 9 Templates</strong> (Full Gallery)
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              <strong>5 Advanced Premium Forms</strong> (Exclusive to Pro)
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              SaaS Products Document builder
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              Neon Glow Dark Theme Event RSVP
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              Premium D2C Order & Shipping Checkout Form
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              Real-time Live Form drafting panels
            </li>
          </ul>

          <Form method="post" id="pro-plan-form" reloadDocument={actionData?.requireFullReload}>
            <input type="hidden" name="plan" value="pro" />
            <button
              type="submit"
              className="plan-btn pro-btn"
              disabled={currentPlan === "pro"}
            >
              {currentPlan === "pro"
                ? "Active Pro Plan"
                : "Upgrade to Pro"}
            </button>
          </Form>
        </div>
      </div>

      {currentPlan !== "free" && (
        <s-section>
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "#6d7175",
                textDecoration: "underline",
                fontSize: "13px",
                cursor: "pointer",
              }}
              disabled={isDowngrading}
              onClick={handleDowngradeToFree}
            >
              {isDowngrading
                ? "Resetting..."
                : "Reset to Free Plan for Testing"}
            </button>
          </div>
        </s-section>
      )}
    </s-page>
  );
}