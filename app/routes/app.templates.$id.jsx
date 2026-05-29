import { useState } from "react";
import { useLoaderData, useNavigate, Form, useNavigation } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import prisma from "../db.server";
import { authenticate, PLAN_STARTER, PLAN_PRO } from "../shopify.server";
import { FORM_TEMPLATES } from "../templatesData";

export const loader = async ({ request, params }) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;
  const templateId = params.id;

  // Sync active Shopify Billing plans to DB
  const billingCheck = await billing.check({
    plans: [PLAN_STARTER, PLAN_PRO],
    isTest: true,
  });

  let activePlan = "free";
  if (billingCheck.hasActivePayment && billingCheck.appSubscriptions && billingCheck.appSubscriptions.length > 0) {
    const activeSub = billingCheck.appSubscriptions.find(
      (sub) => sub.status === "ACTIVE" || sub.status === "active"
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

  const plan = subscription.plan || "free";

  // Find template data
  const template = FORM_TEMPLATES.find((t) => t.id === templateId);

  // Check query parameter for override unlock status
  const url = new URL(request.url);
  const isUnlockedFromQuery = url.searchParams.get("unlocked") === "true";

  return {
    shop,
    plan,
    template,
    isUnlockedFromQuery,
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const templateId = formData.get("templateId");

  // Save template usage details into SQLite database
  await prisma.templateUsage.create({
    data: {
      shop,
      templateId,
    },
  });

  return { success: true };
};

export default function TemplateDetail() {
  const { plan: currentPlan, template, isUnlockedFromQuery } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const navigation = useNavigation();

  const isSaving = navigation.state === "submitting";

  const [formInputs, setFormInputs] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activeSasaTab, setActiveSasaTab] = useState("about");

  if (!template) {
    return (
      <s-page heading="Error">
        <s-section>
          <s-paragraph>Form template not found.</s-paragraph>
          <s-button onClick={() => navigate("/app")}>Back to Gallery</s-button>
        </s-section>
      </s-page>
    );
  }

  // Determine if this template is locked under user's current plan
  const getLockStatus = () => {
    if (isUnlockedFromQuery) return false; // Overridden unlock from gallery first card logic
    if (template.type === "free") return false;
    if (template.type === "starter") {
      return currentPlan === "free";
    }
    if (template.type === "pro") {
      return currentPlan === "free" || currentPlan === "starter";
    }
    return false;
  };

  const isLocked = getLockStatus();

  const handleInputChange = (fieldId, value) => {
    setFormInputs((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    shopify.toast.show(`Interactive preview form submitted successfully!`, { isError: false });
  };

  const handleReset = () => {
    setFormSubmitted(false);
    setFormInputs({});
  };

  // Render individual form fields dynamically
  const renderField = (field) => {
    const value = formInputs[field.id] || "";
    
    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="form-group">
            <label htmlFor={field.id}>{field.label} {field.required && "*"}</label>
            <textarea
              id={field.id}
              rows={4}
              placeholder={field.placeholder}
              required={field.required}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
          </div>
        );
      case "select":
        return (
          <div key={field.id} className="form-group">
            <label htmlFor={field.id}>{field.label} {field.required && "*"}</label>
            <select
              id={field.id}
              required={field.required}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            >
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );
      case "checkbox":
        return (
          <div key={field.id} className="checkbox-group">
            <input
              type="checkbox"
              id={field.id}
              checked={!!value}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
            />
            <label htmlFor={field.id} style={{ display: "inline", margin: 0 }}>
              {field.label}
            </label>
          </div>
        );
      default:
        return (
          <div key={field.id} className="form-group">
            <label htmlFor={field.id}>{field.label} {field.required && "*"}</label>
            <input
              type={field.type}
              id={field.id}
              placeholder={field.placeholder}
              required={field.required}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
            {field.helpText && <div className="help-text">{field.helpText}</div>}
          </div>
        );
    }
  };

  return (
    <s-page heading={`Live Preview: ${template.name}`}>
      <s-button slot="primary-action" onClick={() => navigate("/app")}>
        Back to Gallery
      </s-button>

      {/* Lock banner if previewing a premium template */}
      {isLocked && (
        <s-section>
          <div className="success-banner" style={{ background: "#eae6ff", color: "#403294", borderColor: "#c0b6f2", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>Preview Mode:</strong> This is a <strong>{template.type.toUpperCase()}</strong> template. You can fully test its layout and interactive inputs, but you must upgrade your subscription to use it in your store.
            </div>
            <s-button onClick={() => navigate("/app/pricing")} variant="primary">
              Upgrade Plan
            </s-button>
          </div>
        </s-section>
      )}

      <div className="detail-layout">
        
        {/* Left column: Template settings & info */}
        <div className="sidebar-settings">
          <s-heading size="small">About this Template</s-heading>
          <s-paragraph style={{ margin: "8px 0" }}>
            {template.description}
          </s-paragraph>
          
          <div className="settings-group">
            <s-text><strong>Category:</strong> <span style={{ textTransform: "capitalize" }}>{template.category}</span></s-text>
            <br />
            <s-text>
              <strong>Tier:</strong>{" "}
              <span style={{ textTransform: "uppercase", color: template.type === "pro" ? "var(--color-pro)" : template.type === "starter" ? "var(--color-starter)" : "#008060", fontWeight: "bold" }}>
                {template.type}
              </span>
            </s-text>
          </div>

          <div className="settings-group">
            <s-heading size="small">Actions</s-heading>
            
            {/* Database logging: use standard form post to log template activation */}
            <Form method="post" style={{ marginTop: "12px" }}>
              <input type="hidden" name="templateId" value={template.id} />
              
              {!isLocked ? (
                <s-button submit variant="primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Use Template"}
                </s-button>
              ) : (
                <s-button onClick={() => navigate("/app/pricing")} variant="secondary">
                  Unlock Template
                </s-button>
              )}
            </Form>

            <s-button onClick={handleReset} variant="tertiary" style={{ marginTop: "8px" }}>
              Reset Fields
            </s-button>
          </div>
        </div>

        {/* Right column: The interactive Form Theme layout */}
        <div className="preview-container">
          
          {/* Submission Success overlay banner */}
          {formSubmitted ? (
            <div style={{ maxWidth: "500px", width: "100%", background: "white", padding: "32px", borderRadius: "12px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", textAlign: "center" }}>
              <div className="success-banner">
                <s-text><strong>Mock Submission Success!</strong> {template.successMessage}</s-text>
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "16px 0 8px" }}>Logged Form Payload:</h3>
              <div style={{ textAlign: "left", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#475569", marginBottom: "24px" }}>
                {template.fields.map((f) => (
                  <p key={f.id} style={{ margin: "4px 0" }}>
                    <strong>{f.label}:</strong> {String(formInputs[f.id] || "None")}
                  </p>
                ))}
              </div>
              <s-button onClick={() => setFormSubmitted(false)} variant="primary">
                Preview Form Again
              </s-button>
            </div>
          ) : (
            <>
              {/* Render based on specific template theme */}
              
              {/* 1. Newsletter Signup (Free) */}
              {template.styleName === "minimalist-glass" && (
                <form onSubmit={handleFormSubmit} className="form-minimalist-glass">
                  <h2>{template.name}</h2>
                  <p className="subtitle">{template.subtitle}</p>
                  {template.fields.map((f) => renderField(f))}
                  <button type="submit" className="btn-submit">
                    {template.submitText}
                  </button>
                </form>
              )}

              {/* 2. Customer Support & Feedback (Starter) */}
              {template.styleName === "support-clean" && (
                <form onSubmit={handleFormSubmit} className="form-support-clean">
                  <h2>{template.name}</h2>
                  <p className="subtitle">{template.subtitle}</p>
                  {template.fields.map((f) => renderField(f))}
                  <button type="submit" className="btn-submit">
                    {template.submitText}
                  </button>
                </form>
              )}

              {/* 3. Job Application Form (Starter - Eugen Esanu style) */}
              {template.styleName === "job-modern" && (
                <form onSubmit={handleFormSubmit} className="form-job-modern">
                  <div className="form-header">
                    <h2>Application form</h2>
                    <p className="subtitle">Add fields that you want your candidates to fill in when applying</p>
                  </div>
                  
                  <div className="form-body">
                    <div className="group-title">Default fields</div>
                    {template.fields.filter(f => f.group === "Default fields").map(f => renderField(f))}

                    <div className="group-title">Additional fields</div>
                    {template.fields.filter(f => f.group === "Additional fields").map(f => renderField(f))}
                  </div>

                  <div className="form-footer">
                    <button type="button" className="btn-back" onClick={() => navigate("/app")}>
                      Back: Job description
                    </button>
                    <button type="submit" className="btn-next">
                      {template.submitText}
                    </button>
                  </div>
                </form>
              )}

              {/* 4. Custom Audit Form (Starter - Yuktha Mukhi style) */}
              {template.styleName === "audit-blue" && (
                <div className="audit-wrapper">
                  <div className="audit-header-banner">
                    <h1>Customize audit forms</h1>
                    <div className="audit-tags">
                      <span className="audit-tag">#hassle free</span>
                      <span className="audit-tag">#organized</span>
                      <span className="audit-tag">#time-saver</span>
                    </div>
                  </div>
                  <form onSubmit={handleFormSubmit} className="audit-form-container">
                    <h2>Audit Details</h2>
                    {template.fields.map((f) => renderField(f))}
                    <button type="submit" className="btn-submit" style={{ marginTop: "12px" }}>
                      {template.submitText}
                    </button>
                  </form>
                </div>
              )}

              {/* 5. SaaS Product Settings (Pro - Monty Hayton style) */}
              {template.styleName === "saas-dashboard" && (
                <div className="saas-wrapper">
                  <div className="saas-tabs">
                    <button
                      type="button"
                      className={`saas-tab ${activeSasaTab === "about" ? "active" : ""}`}
                      onClick={() => setActiveSasaTab("about")}
                    >
                      About
                    </button>
                    <button
                      type="button"
                      className="saas-tab"
                      onClick={() => shopify.toast.show("Customizer modifier settings unlocked.", { isError: false })}
                    >
                      Modifiers
                    </button>
                  </div>

                  <div className="saas-grid">
                    {/* Left: Input Fields */}
                    <form onSubmit={handleFormSubmit} className="saas-left">
                      <h3>Edit Item settings</h3>
                      {template.fields.map((f) => renderField(f))}
                      <button type="submit" className="btn-save" style={{ marginTop: "12px" }}>
                        {template.submitText}
                      </button>
                    </form>

                    {/* Right: Live Draft Document sheet (updates on text change!) */}
                    <div className="saas-right">
                      <div className="draft-document">
                        <div className="draft-header">
                          <span className="draft-badge">Draft Preview</span>
                          <span style={{ fontSize: "11px", color: "#a0aec0" }}>Invoice No. #456</span>
                        </div>
                        
                        <h4 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 16px" }}>
                          {formInputs.name || "Draft settings platform"}
                        </h4>

                        <div className="draft-date-grid">
                          <div className="draft-date-item">
                            ISSUED
                            <strong>{new Date().toLocaleDateString()}</strong>
                          </div>
                          <div className="draft-date-item">
                            PRODUCT TYPE
                            <strong>{formInputs.product_type || "Select"}</strong>
                          </div>
                        </div>

                        <div className="draft-body">
                          <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "#a0aec0", margin: "16px 0 6px" }}>Description</h4>
                          <p style={{ fontStyle: "italic", color: "#718096" }}>
                            {formInputs.description || "In publishing and graphic design, Lorem ipsum is a placeholder text commonly used..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Neon RSVP / Event Reservation (Pro) */}
              {template.styleName === "neon-event" && (
                <form onSubmit={handleFormSubmit} className="form-neon-rsvp">
                  <h2>{template.name}</h2>
                  <p className="subtitle">{template.subtitle}</p>
                  {template.fields.map((f) => renderField(f))}
                  <button type="submit" className="btn-submit">
                    {template.submitText}
                  </button>
                </form>
              )}

              {/* 7. Premium Order Form (Pro) */}
              {template.styleName === "checkout-premium" && (
                <form onSubmit={handleFormSubmit} className="form-checkout-premium">
                  <h2>{template.name}</h2>
                  {template.fields.map((f) => renderField(f))}
                  <button type="submit" className="btn-submit">
                    {template.submitText}
                  </button>
                </form>
              )}

              {/* 8. CSAT Feedback (Pro) */}
              {template.styleName === "csat-feedback" && (
                <div className="form-csat-feedback">
                  <div className="csat-header">
                    <h2>{template.name}</h2>
                    <p>{template.subtitle}</p>
                  </div>
                  <form onSubmit={handleFormSubmit} className="csat-body">
                    {template.fields.map((f) => renderField(f))}
                    <button type="submit" className="btn-submit" style={{ marginTop: "12px" }}>
                      {template.submitText}
                    </button>
                  </form>
                </div>
              )}

              {/* 9. Academy Registration (Pro) */}
              {template.styleName === "academy-signup" && (
                <form onSubmit={handleFormSubmit} className="form-academy-signup">
                  <h2>{template.name}</h2>
                  <p className="subtitle">{template.subtitle}</p>
                  {template.fields.map((f) => renderField(f))}
                  <button type="submit" className="btn-submit">
                    {template.submitText}
                  </button>
                </form>
              )}

            </>
          )}

        </div>
      </div>
    </s-page>
  );
}
