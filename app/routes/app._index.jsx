/* global process */
import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, Form, redirect, useActionData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import prisma from "../db.server";
import { authenticate, PLAN_STARTER, PLAN_PRO } from "../shopify.server";
import { FORM_TEMPLATES } from "../templatesData";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;

  // Sync active Shopify Billing plans to DB
  let isTestEnv = true; // Set to true to allow testing billing on development stores
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

  let activePlan = "free";
  if (billingCheck.hasActivePayment && billingCheck.appSubscriptions && billingCheck.appSubscriptions.length > 0) {
    const activeSub = billingCheck.appSubscriptions.find(
      (sub) => sub.status === "ACTIVE" || sub.status === "active" || sub.status === "ACCEPTED"
    );
    if (activeSub) {
      if (activeSub.name === PLAN_PRO) {
        activePlan = "pro";
      } else if (activeSub.name === PLAN_STARTER) {
        activePlan = "starter";
      }
    }
  }

  // Find or create/update subscription in the database
  const subscription = await prisma.storeSubscription.upsert({
    where: { shop },
    update: { 
      plan: activePlan,
      billingStatus: "active",
      email: session.email || "",
      ownerName: session.firstName ? `${session.firstName} ${session.lastName || ""}`.trim() : "",
    },
    create: {
      shop,
      plan: activePlan,
      billingStatus: "active",
      email: session.email || "",
      ownerName: session.firstName ? `${session.firstName} ${session.lastName || ""}`.trim() : "",
      shopName: session.shop,
    },
  });

  return {
    shop,
    plan: subscription.plan || "free",
  };
};

export const action = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "resetPlan") {
    // Cancel subscriptions in Shopify
    let isTestEnv = true; // Set to true to allow testing billing on development stores
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
            isTest: true,
            prorate: true,
          });
        }
      }
    }
    await prisma.storeSubscription.upsert({
      where: { shop },
      update: { plan: "free" },
      create: { shop, plan: "free" },
    });
  } else if (actionType === "useTemplate") {
    const templateId = formData.get("templateId");
    const templateName = formData.get("templateName");

    // Save to DB
    await prisma.selectedTemplate.upsert({
      where: { shop },
      update: { templateId, templateName, updatedAt: new Date() },
      create: { shop, templateId, templateName },
    });

    // Redirect to the editor page
    const url = new URL(request.url);
    url.pathname = `/app/templates/${templateId}`;
    url.searchParams.set("success", "true");
    return { success: true, redirectUrl: url.pathname + url.search };
  }

  return { success: true };
};

export default function Gallery() {
  const { plan: currentPlan = "free" } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const actionData = useActionData();

  useEffect(() => {
    if (actionData?.redirectUrl) {
      navigate(actionData.redirectUrl);
    }
  }, [actionData, navigate]);

  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTier, setActiveTier] = useState("all");
  const [showUpgradeWarning, setShowUpgradeWarning] = useState(null);

  // Central state to handle interactive fields directly inside the card previews
  const [formInputs, setFormInputs] = useState({
    "newsletter-signup-email": "",
    "customer-support-name": "",
    "customer-support-email": "",
    "customer-support-category": "Billing Inquiry",
    "customer-support-message": "",
    "customer-support-urgent": false,
    "job-application-name": "",
    "job-application-email": "",
    "job-application-phone": "",
    "job-application-desired_employment": "Full-time (40h/week)",
    "job-application-desired_schedule": "Flexible hours",
    "job-application-experience": "",
    "audit-details-location": "",
    "audit-details-auditor_name": "",
    "audit-details-date": "",
    "audit-details-notes": "",
    "saas-settings-name": "",
    "saas-settings-product_type": "Burgers",
    "saas-settings-description": "",
    "neon-rsvp-name": "",
    "neon-rsvp-email": "",
    "neon-rsvp-guests": "1 Guest",
    "neon-rsvp-dietary": "",
    "checkout-order-customer_name": "",
    "checkout-order-shipping_address": "",
    "checkout-order-city": "",
    "checkout-order-zipcode": "",
    "checkout-order-quantity": "1 unit",
    "csat-feedback-rating": "5 - Excellent 😊",
    "csat-feedback-review_title": "",
    "csat-feedback-review_body": "",
    "academy-signup-student_name": "",
    "academy-signup-dob": "",
    "academy-signup-subject": "Shopify App Development",
    "academy-signup-session_time": "Morning class (9 AM - 12 PM)",
  });

  const handleValChange = (key, value) => {
    setFormInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleMockSubmit = (templateName) => {
    shopify.toast.show(`Tested interactive form: "${templateName}" directly inside card!`, { isError: false });
  };

  // Filter templates based on tier and category
  const filteredTemplates = FORM_TEMPLATES.filter((template) => {
    const matchesCategory = activeCategory === "all" || template.category === activeCategory;
    const matchesTier = activeTier === "all" || template.type === activeTier;
    return matchesCategory && matchesTier;
  });

  // Calculate item counts for each tier, filtered by current category selection
  const getTierCount = (tier) => {
    return FORM_TEMPLATES.filter((template) => {
      const matchesCategory = activeCategory === "all" || template.category === activeCategory;
      const matchesTier = tier === "all" || template.type === tier;
      return matchesCategory && matchesTier;
    }).length;
  };

  const getLockStatus = (templateType, index) => {
    if (index === 0 || templateType === "free") return false;
    if (templateType === "starter") return currentPlan === "free";
    if (templateType === "pro") return currentPlan === "free" || currentPlan === "starter";
    return false;
  };


  const renderCardForm = (template) => {
    switch (template.styleName) {
      case "minimalist-glass":
        return (
          <form className="form-minimalist-glass" onSubmit={(e) => e.preventDefault()}>
            <h2>{template.name}</h2>
            <p className="subtitle">{template.subtitle}</p>
            <div className="form-group">
              <label htmlFor="newsletter-signup-email">Email Address *</label>
              <input
                id="newsletter-signup-email"
                type="email"
                placeholder="alex@example.com"
                value={formInputs["newsletter-signup-email"] || ""}
                onChange={(e) => handleValChange("newsletter-signup-email", e.target.value)}
              />
            </div>
            <button className="btn-submit" type="button" onClick={() => handleMockSubmit(template.name)}>
              {template.submitText}
            </button>
          </form>
        );
      case "support-clean":
        return (
          <form className="form-support-clean" onSubmit={(e) => e.preventDefault()}>
            <h2>{template.name}</h2>
            <p className="subtitle">{template.subtitle}</p>
            <div className="form-group">
              <label htmlFor="customer-support-name">Your Name *</label>
              <input
                id="customer-support-name"
                type="text"
                placeholder="Jane Doe"
                value={formInputs["customer-support-name"] || ""}
                onChange={(e) => handleValChange("customer-support-name", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="customer-support-email">Email Address *</label>
              <input
                id="customer-support-email"
                type="email"
                placeholder="jane.doe@example.com"
                value={formInputs["customer-support-email"] || ""}
                onChange={(e) => handleValChange("customer-support-email", e.target.value)}
              />
            </div>
            <button className="btn-submit" type="button" onClick={() => handleMockSubmit(template.name)}>
              {template.submitText}
            </button>
          </form>
        );
      case "job-modern":
        return (
          <form className="form-job-modern" onSubmit={(e) => e.preventDefault()}>
            <div className="form-header">
              <h2>Application form</h2>
              <p className="subtitle">Add fields that you want your candidates to fill in</p>
            </div>
            <div className="form-body" style={{ padding: "12px" }}>
              <div className="form-group">
                <label htmlFor="job-application-name">Full Name *</label>
                <input
                  id="job-application-name"
                  type="text"
                  placeholder="E.g. John Smith"
                  value={formInputs["job-application-name"] || ""}
                  onChange={(e) => handleValChange("job-application-name", e.target.value)}
                />
              </div>
            </div>
            <div className="form-footer" style={{ padding: "12px" }}>
              <button className="btn-next" style={{ width: "100%" }} type="button" onClick={() => handleMockSubmit(template.name)}>
                {template.submitText}
              </button>
            </div>
          </form>
        );
      case "audit-blue":
        return (
          <div className="audit-wrapper">
            <div className="audit-header-banner" style={{ padding: "16px" }}>
              <h1 style={{ fontSize: "16px", margin: 0 }}>Customize audit</h1>
            </div>
            <form className="audit-form-container" style={{ padding: "16px" }} onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="audit-details-location">Location *</label>
                <input
                  id="audit-details-location"
                  type="text"
                  placeholder="Enter Location"
                  value={formInputs["audit-details-location"] || ""}
                  onChange={(e) => handleValChange("audit-details-location", e.target.value)}
                />
              </div>
              <button className="btn-submit" type="button" onClick={() => handleMockSubmit(template.name)}>
                {template.submitText}
              </button>
            </form>
          </div>
        );
      case "saas-dashboard":
        return (
          <div className="saas-wrapper">
            <div className="saas-grid" style={{ gridTemplateColumns: "1fr" }}>
              <form className="saas-left" onSubmit={(e) => e.preventDefault()}>
                <h3 style={{ fontSize: "14px", margin: 0 }}>Edit settings</h3>
                <div className="form-group">
                  <label htmlFor="saas-settings-name">Name *</label>
                  <input
                    id="saas-settings-name"
                    type="text"
                    placeholder="Burger Rings"
                    value={formInputs["saas-settings-name"] || ""}
                    onChange={(e) => handleValChange("saas-settings-name", e.target.value)}
                  />
                </div>
                <button className="btn-save" type="button" onClick={() => handleMockSubmit(template.name)}>
                  {template.submitText}
                </button>
              </form>
            </div>
          </div>
        );
      case "neon-event":
        return (
          <form className="form-neon-rsvp" style={{ padding: "16px" }} onSubmit={(e) => e.preventDefault()}>
            <h2 style={{ fontSize: "14px" }}>{template.name}</h2>
            <div className="form-group">
              <label htmlFor="neon-rsvp-name">Full Name *</label>
              <input
                id="neon-rsvp-name"
                type="text"
                placeholder="Gavin Belson"
                value={formInputs["neon-rsvp-name"] || ""}
                onChange={(e) => handleValChange("neon-rsvp-name", e.target.value)}
              />
            </div>
            <button className="btn-submit" type="button" onClick={() => handleMockSubmit(template.name)}>
              {template.submitText}
            </button>
          </form>
        );
      case "checkout-premium":
        return (
          <form className="form-checkout-premium" onSubmit={(e) => e.preventDefault()}>
            <h2 style={{ fontSize: "14px" }}>{template.name}</h2>
            <div className="form-group">
              <label htmlFor="checkout-order-customer_name">Recipient Name *</label>
              <input
                id="checkout-order-customer_name"
                type="text"
                placeholder="Rich Hendrick"
                value={formInputs["checkout-order-customer_name"] || ""}
                onChange={(e) => handleValChange("checkout-order-customer_name", e.target.value)}
              />
            </div>
            <button className="btn-submit" type="button" onClick={() => handleMockSubmit(template.name)}>
              {template.submitText}
            </button>
          </form>
        );
      case "csat-feedback":
        return (
          <div className="form-csat-feedback">
            <div className="csat-header" style={{ padding: "10px" }}>
              <h2 style={{ fontSize: "14px", margin: 0 }}>{template.name}</h2>
            </div>
            <form className="csat-body" style={{ padding: "12px" }} onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="csat-feedback-rating">Overall Experience *</label>
                <select
                  id="csat-feedback-rating"
                  value={formInputs["csat-feedback-rating"] || "5 - Excellent 😊"}
                  onChange={(e) => handleValChange("csat-feedback-rating", e.target.value)}
                >
                  <option value="5 - Excellent 😊">5 - Excellent 😊</option>
                  <option value="4 - Good 🙂">4 - Good 🙂</option>
                  <option value="3 - Average 😐">3 - Average 😐</option>
                  <option value="2 - Poor 🙁">2 - Poor 🙁</option>
                  <option value="1 - Terrible 😠">1 - Terrible 😠</option>
                </select>
              </div>
              <button className="btn-submit" type="button" onClick={() => handleMockSubmit(template.name)}>
                {template.submitText}
              </button>
            </form>
          </div>
        );
      case "academy-signup":
        return (
          <form className="form-academy-signup" onSubmit={(e) => e.preventDefault()}>
            <h2 style={{ fontSize: "14px" }}>{template.name}</h2>
            <div className="form-group">
              <label htmlFor="academy-signup-student_name">Student Name *</label>
              <input
                id="academy-signup-student_name"
                type="text"
                placeholder="E.g. Richard Hendricks"
                value={formInputs["academy-signup-student_name"] || ""}
                onChange={(e) => handleValChange("academy-signup-student_name", e.target.value)}
              />
            </div>
            <button className="btn-submit" type="button" onClick={() => handleMockSubmit(template.name)}>
              {template.submitText}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <s-page heading="Form Templates Gallery">
      <s-button slot="primary-action" onClick={() => navigate("/app/pricing")}>
        {currentPlan === "free" ? "Choose Plan" : `Plan: ${currentPlan.toUpperCase()}`}
      </s-button>

      {/* Hero section */}
      <s-section>
        <s-box padding="base" borderWidth="none" borderRadius="base">
          <s-heading size="large">Select & Customize Your Store Forms</s-heading>
          <s-paragraph>
            Type directly in the cards below to test interactive fields. Click <strong>Use Template</strong> to configure or select <strong>Full Page Preview</strong> to inspect layout functionality.
          </s-paragraph>
          {currentPlan !== "free" && (
            <div style={{ marginTop: "12px" }}>
              <Form method="post" style={{ display: "inline-block" }}>
                <input type="hidden" name="actionType" value="resetPlan" />
                <s-button submit variant="secondary">
                  Reset Store Plan to Free for Testing
                </s-button>
              </Form>
            </div>
          )}
        </s-box>
      </s-section>

      {/* Upgrade Warning banner */}
      {showUpgradeWarning && (
        <s-section>
          <div className="success-banner" style={{ background: "#eae6ff", color: "#403294", borderColor: "#c0b6f2" }}>
            <s-stack direction="inline" gap="base" align="center" justify="space-between" style={{ width: "100%" }}>
              <s-text>
                <strong>Locked Content:</strong> <strong>{showUpgradeWarning.name}</strong> is a {showUpgradeWarning.type.toUpperCase()} template. Please upgrade your subscription to use it.
              </s-text>
              <s-stack direction="inline" gap="tight">
                <s-button onClick={() => navigate("/app/pricing")} variant="primary">
                  View Plans
                </s-button>
                <s-button onClick={() => setShowUpgradeWarning(null)} variant="tertiary">
                  Dismiss
                </s-button>
              </s-stack>
            </s-stack>
          </div>
        </s-section>
      )}

      {/* Filter toolbar */}
      <s-section>
        <div className="gallery-container">
          <div className="gallery-filters">
            <s-text>Category: </s-text>
            <button 
              className={`filter-pill ${activeCategory === "all" ? "active" : ""}`} 
              onClick={() => setActiveCategory("all")}
            >
              All
            </button>
            <button 
              className={`filter-pill ${activeCategory === "marketing" ? "active" : ""}`} 
              onClick={() => setActiveCategory("marketing")}
            >
              Marketing
            </button>
            <button 
              className={`filter-pill ${activeCategory === "feedback" ? "active" : ""}`} 
              onClick={() => setActiveCategory("feedback")}
            >
              Feedback
            </button>
            <button 
              className={`filter-pill ${activeCategory === "operations" ? "active" : ""}`} 
              onClick={() => setActiveCategory("operations")}
            >
              Operations
            </button>
            <button 
              className={`filter-pill ${activeCategory === "event" ? "active" : ""}`} 
              onClick={() => setActiveCategory("event")}
            >
              Events
            </button>

            <span style={{ margin: "0 8px", color: "#c9cccf" }}>|</span>

            <s-text>Tier: </s-text>
            <button 
              className={`filter-pill ${activeTier === "all" ? "active" : ""}`} 
              onClick={() => setActiveTier("all")}
            >
              All ({getTierCount("all")})
            </button>
            <button 
              className={`filter-pill tier-free ${activeTier === "free" ? "active" : ""}`} 
              onClick={() => setActiveTier("free")}
            >
              Free ({getTierCount("free")})
            </button>
            <button 
              className={`filter-pill tier-starter ${activeTier === "starter" ? "active" : ""}`} 
              onClick={() => setActiveTier("starter")}
            >
              Starter ({getTierCount("starter")})
            </button>
            <button 
              className={`filter-pill tier-pro ${activeTier === "pro" ? "active" : ""}`} 
              onClick={() => setActiveTier("pro")}
            >
              Pro ({getTierCount("pro")})
            </button>
          </div>

          {/* Cards Grid */}
          <div className="templates-grid">
            {filteredTemplates.map((template, index) => {
              const isFirstCard = index === 0;
              const isLocked = getLockStatus(template.type, index);
              
              // Custom borders based on lock type
              let cardLockClass = "";
              if (isLocked) {
                cardLockClass = template.type === "starter" ? "locked-starter" : "locked-pro";
              }

              return (
                <div key={template.id} className={`template-card ${cardLockClass}`}>
                  {/* Tier status badge */}
                  <span className={`template-badge ${isFirstCard ? "free" : template.type}`}>
                    {isFirstCard ? "Free" : template.type === "free" ? "Free" : "Premium"}
                  </span>

                  {/* Fully Interactive preview inside card */}
                  <div className="card-interactive-preview">
                    <div className={isLocked ? "locked-preview-blur" : ""} style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
                      {renderCardForm(template)}
                    </div>

                    {/* Small lock overlay if it is locked */}
                    {isLocked && (
                      <div className="card-lock-overlay">
                        <div className="card-lock-overlay-content">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                          </svg>
                          Locked
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Description and details */}
                  <div className="template-info">
                    <h3 className="template-title">{template.name}</h3>
                    <p className="template-desc">{template.description}</p>
                    
                    <div className="template-footer" style={{ flexWrap: "wrap", gap: "8px" }}>
                      <button 
                        type="button" 
                        className="preview-link-btn"
                        onClick={() => navigate(`/app/templates/${template.id}${isFirstCard ? "?unlocked=true" : ""}`)}
                      >
                        Full Page Preview
                      </button>

                      {currentPlan !== "pro" && (
                        <button
                          type="button"
                          className="btn-upgrade-pro"
                          onClick={() => navigate("/app/pricing")}
                        >
                          Upgrade to Pro
                        </button>
                      )}

                      {/* Access logic buttons */}
                      {!isLocked ? (
                        <Form method="post" style={{ margin: 0, padding: 0 }}>
                          <input type="hidden" name="actionType" value="useTemplate" />
                          <input type="hidden" name="templateId" value={template.id} />
                          <input type="hidden" name="templateName" value={template.name} />
                          <button 
                            type="submit" 
                            className="btn-use-template"
                          >
                            Use Template
                          </button>
                        </Form>
                      ) : (
                        <button 
                          type="button" 
                          className="btn-unlock-upgrade"
                          onClick={() => navigate("/app/pricing")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="12" height="12" style={{ fill: "currentColor" }}>
                            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                          </svg>
                          Unlock
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>


          {filteredTemplates.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#6d7175" }}>
              <s-paragraph>No templates match this filter combination.</s-paragraph>
              <s-button onClick={() => { setActiveCategory("all"); setActiveTier("all"); }}>
                Reset Filters
              </s-button>
            </div>
          )}
        </div>
      </s-section>
    </s-page>
  );
}
