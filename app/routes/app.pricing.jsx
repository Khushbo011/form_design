import { useState } from "react";
import { useLoaderData, Form, useNavigate, useNavigation } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Retrieve current subscription plan from DB
  const subscription = await prisma.storeSubscription.findUnique({
    where: { shop },
  });

  return {
    shop,
    plan: subscription ? subscription.plan : "free",
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const requestedPlan = formData.get("plan"); // "free", "starter", "pro"

  // Upsert plan details to ensure database persistence
  const updatedSubscription = await prisma.storeSubscription.upsert({
    where: { shop },
    update: { 
      plan: requestedPlan,
      billingStatus: "active",
    },
    create: {
      shop,
      plan: requestedPlan,
      billingStatus: "active",
      email: session.email || "",
      ownerName: session.firstName ? `${session.firstName} ${session.lastName || ""}`.trim() : "",
      shopName: session.shop,
    },
  });

  return { 
    success: true, 
    plan: updatedSubscription.plan 
  };
};

export default function Pricing() {
  const { plan: currentPlan } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const handleAlert = (planName) => {
    shopify.toast.show(`Redirecting to Shopify Billing for ${planName}...`, { isError: false });
  };

  return (
    <s-page heading="Plans & Subscriptions">
      <s-button slot="primary-action" onClick={() => navigate("/app")}>
        Back to Gallery
      </s-button>

      {/* Pricing header */}
      <div className="pricing-header">
        <h1>Select a Plan to Unlock Form Design Templates</h1>
        <p>Start with our basic features or upgrade to unlock advanced form templates and live visual builders.</p>
      </div>

      {/* 2-Plan Grid Layout */}
      <div className="plans-container" style={{ maxWidth: "800px" }}>
        
        {/* STARTER PLAN - $49 */}
        <div className={`plan-card ${currentPlan === "starter" ? "active-plan" : ""}`}>
          {currentPlan === "starter" && (
            <span className="plan-badge" style={{ background: "var(--color-starter)" }}>Active Plan</span>
          )}
          <h2 className="plan-name">Starter Plan</h2>
          <div className="plan-price-box" style={{ color: "var(--color-starter)" }}>
            <span className="plan-price">$49</span>
            <span className="plan-period">/ month</span>
          </div>

          <s-paragraph style={{ textAlign: "center", color: "#6d7175" }}>
            Unlocks selected premium templates and additional customization features.
          </s-paragraph>

          <ul className="plan-features-list">
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              <strong>Unlock 4 Templates</strong> (Free + Starter)
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Customer Feedback & Support Form
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Job Application & Careers Form
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Standard Custom Audit Logs Form
            </li>
            <li className="plan-feature-item disabled">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              SaaS Live Builder (Pro Only)
            </li>
            <li className="plan-feature-item disabled">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              5 Exclusive Pro Forms (Pro Only)
            </li>
          </ul>

          <Form method="post">
            <input type="hidden" name="plan" value="starter" />
            <button 
              type="submit" 
              className="plan-btn starter-btn"
              disabled={isSubmitting || currentPlan === "starter"}
              onClick={() => handleAlert("Starter")}
            >
              {currentPlan === "starter" ? "Active Starter Plan" : "Upgrade to Starter"}
            </button>
          </Form>
        </div>

        {/* PRO PLAN - $99 */}
        <div className={`plan-card featured ${currentPlan === "pro" ? "active-plan" : ""}`}>
          <span className="plan-badge" style={{ background: "var(--color-pro)" }}>Pro Tier</span>
          <h2 className="plan-name">Pro Plan</h2>
          <div className="plan-price-box" style={{ color: "var(--color-pro)" }}>
            <span className="plan-price">$99</span>
            <span className="plan-period">/ month</span>
          </div>

          <s-paragraph style={{ textAlign: "center", color: "#6d7175" }}>
            Unlock all templates, advanced builders, and 5 exclusive Pro forms.
          </s-paragraph>

          <ul className="plan-features-list">
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              <strong>Unlock All 9 Templates</strong> (Full Gallery)
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              <strong>5 Advanced Premium Forms</strong> (Exclusive to Pro)
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              SaaS Products Document builder
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Neon Glow Dark Theme Event RSVP
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Premium D2C Order & Shipping Checkout Form
            </li>
            <li className="plan-feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Real-time Live Form drafting panels
            </li>
          </ul>

          <Form method="post">
            <input type="hidden" name="plan" value="pro" />
            <button 
              type="submit" 
              className="plan-btn pro-btn"
              disabled={isSubmitting || currentPlan === "pro"}
              onClick={() => handleAlert("Pro")}
            >
              {currentPlan === "pro" ? "Active Pro Plan" : "Upgrade to Pro"}
            </button>
          </Form>
        </div>

      </div>

      {currentPlan !== "free" && (
        <s-section>
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <Form method="post">
              <input type="hidden" name="plan" value="free" />
              <button 
                type="submit" 
                style={{ background: "none", border: "none", color: "#6d7175", textDecoration: "underline", fontSize: "13px" }}
                disabled={isSubmitting}
              >
                Reset to Free Plan for Testing
              </button>
            </Form>
          </div>
        </s-section>
      )}
    </s-page>
  );
}
