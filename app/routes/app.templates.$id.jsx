/* eslint-disable react/prop-types, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { useState, useCallback, useRef, useEffect } from "react";
import { useLoaderData, useNavigate, Form, useNavigation, useActionData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import prisma from "../db.server";
import { authenticate, PLAN_STARTER, PLAN_PRO } from "../shopify.server";
import { FORM_TEMPLATES } from "../templatesData";

export const loader = async ({ request, params }) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;
  const templateId = params.id;

  let isTestEnv = process.env.NODE_ENV !== "production";
  let billingCheck = await billing.check({
    plans: [PLAN_STARTER, PLAN_PRO],
    isTest: isTestEnv,
  });

  if (!billingCheck.hasActivePayment) {
    // Fallback: Check for test charges. App Reviewers test in production with dev stores,
    // which automatically create test charges.
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
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const templateId = formData.get("templateId");

  if (actionType === "upgrade") {
    const planToUpgrade = formData.get("planToUpgrade");
    const planName = planToUpgrade === "pro" ? PLAN_PRO : PLAN_STARTER;
    const returnUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/app`;

    try {
      await billing.request({
        plan: planName,
        isTest: process.env.NODE_ENV !== "production",
        returnUrl,
      });
    } catch (error) {
      if (error instanceof Response) {
        const reauthUrl = error.headers.get("X-Shopify-API-Request-Failure-Reauthorize-Url");
        if (reauthUrl) return { billingUrl: reauthUrl };

        const location = error.headers.get("Location");
        if (location) return { billingUrl: location };

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
          return { requireFullReload: true };
        }
        return { billingError: `Unexpected response status: ${error.status}` };
      }
      throw error;
    }
    return { billingError: "Billing request did not produce a redirect." };
  }

  // Save template usage details into database
  await prisma.templateUsage.create({
    data: {
      shop,
      templateId,
    },
  });

  return { success: true };
};

// ─── DEFAULT DESIGN VALUES ──────────────────────────────────────────────────
const DEFAULT_DESIGN = {
  // Colors
  formBg: "#ffffff",
  formTextColor: "#202223",
  labelColor: "#475569",
  inputBg: "#ffffff",
  inputBorderColor: "#cbd5e1",
  inputTextColor: "#334155",
  placeholderColor: "#94a3b8",
  buttonBg: "#6366f1",
  buttonTextColor: "#ffffff",
  // Typography
  fontFamily: "Inter",
  fontSize: 14,
  labelFontSize: 13,
  labelFontWeight: "600",
  // Layout
  formWidth: 100,
  formPadding: 32,
  fieldSpacing: 16,
  // Borders
  formBorderRadius: 12,
  inputBorderRadius: 6,
  buttonBorderRadius: 8,
  formBorderWidth: 1,
  formBorderColor: "#e2e8f0",
  // Button
  buttonPadding: 12,
  // Custom CSS
  customCss: "",
};

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Outfit",
  "Poppins",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Source Sans 3",
  "Nunito",
  "Raleway",
  "DM Sans",
  "Space Grotesk",
];

// Chevron SVG for collapsible sections
const ChevronDown = ({ isOpen }) => (
  <svg
    className={`customize-section-chevron ${isOpen ? "open" : ""}`}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
      clipRule="evenodd"
    />
  </svg>
);

// ─── COLOR PICKER CONTROL ───────────────────────────────────────────────────
function ColorControl({ label, value, onChange }) {
  return (
    <div className="ctrl-group">
      <div className="ctrl-label">{label}</div>
      <div className="ctrl-color-row">
        <input
          type="color"
          className="ctrl-color-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="ctrl-color-hex"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
        />
      </div>
    </div>
  );
}

// ─── RANGE SLIDER CONTROL ───────────────────────────────────────────────────
function RangeControl({ label, value, onChange, min, max, step = 1, unit = "px" }) {
  return (
    <div className="ctrl-group">
      <div className="ctrl-label">
        {label}
        <span className="ctrl-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        className="ctrl-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// ─── SELECT CONTROL ─────────────────────────────────────────────────────────
function SelectControl({ label, value, onChange, options }) {
  return (
    <div className="ctrl-group">
      <div className="ctrl-label">{label}</div>
      <select
        className="ctrl-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
            {typeof opt === "string" ? opt : opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── COLLAPSIBLE SECTION ────────────────────────────────────────────────────
function CollapsibleSection({ icon, title, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="customize-section">
      <div
        className="customize-section-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="customize-section-title">
          <span className="section-icon">{icon}</span>
          {title}
        </div>
        <ChevronDown isOpen={isOpen} />
      </div>
      {isOpen && <div className="customize-section-body">{children}</div>}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function TemplateDetail() {
  const { plan: currentPlan, template, isUnlockedFromQuery } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const navigation = useNavigation();
  const actionData = useActionData();
  const customStyleRef = useRef(null);

  const isSaving = navigation.state === "submitting";

  const [formInputs, setFormInputs] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activeSasaTab, setActiveSasaTab] = useState("about");
  const [activePanel, setActivePanel] = useState("design"); // "design" | "info"

  // ── Design customization state ──────────────────────────────────────────
  const [design, setDesign] = useState({ ...DEFAULT_DESIGN });

  const updateDesign = useCallback((key, value) => {
    setDesign((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetDesign = useCallback(() => {
    setDesign({ ...DEFAULT_DESIGN });
    shopify.toast.show("Design reset to defaults", { isError: false });
  }, [shopify]);

  // ── Inject custom CSS into a <style> element ──────────────────────────────
  useEffect(() => {
    if (!customStyleRef.current) {
      const styleEl = document.createElement("style");
      styleEl.setAttribute("data-custom-design", "true");
      document.head.appendChild(styleEl);
      customStyleRef.current = styleEl;
    }
    customStyleRef.current.textContent = design.customCss;

    return () => {
      if (customStyleRef.current) {
        customStyleRef.current.remove();
        customStyleRef.current = null;
      }
    };
  }, [design.customCss]);

  // ── Handle Action Data (Billing / Success) ────────────────────────────────
  useEffect(() => {
    if (actionData?.success) {
      shopify.toast.show("Template activated successfully!");
    } else if (actionData?.billingUrl) {
      shopify.toast.show("Redirecting to billing approval...");
      window.open(actionData.billingUrl, "_top");
    } else if (actionData?.requireFullReload) {
      window.top.location.reload();
    } else if (actionData?.billingError) {
      shopify.toast.show(actionData.billingError, { isError: true });
    }
  }, [actionData, shopify]);

  // ── Load Google Font dynamically ──────────────────────────────────────────
  useEffect(() => {
    if (design.fontFamily && design.fontFamily !== "Inter") {
      const linkId = `gfont-${design.fontFamily.replace(/\s+/g, "-")}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(design.fontFamily)}:wght@400;500;600;700;800&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [design.fontFamily]);

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
    if (isUnlockedFromQuery) return false;
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

  // ── Build inline style object from design state ───────────────────────────
  const buildFormStyle = () => ({
    fontFamily: `'${design.fontFamily}', sans-serif`,
    fontSize: `${design.fontSize}px`,
    backgroundColor: design.formBg,
    color: design.formTextColor,
    padding: `${design.formPadding}px`,
    borderRadius: `${design.formBorderRadius}px`,
    borderWidth: `${design.formBorderWidth}px`,
    borderColor: design.formBorderColor,
    borderStyle: "solid",
    width: `${design.formWidth}%`,
    maxWidth: design.formWidth === 100 ? "none" : undefined,
    "--custom-label-color": design.labelColor,
    "--custom-label-size": `${design.labelFontSize}px`,
    "--custom-label-weight": design.labelFontWeight,
    "--custom-input-bg": design.inputBg,
    "--custom-input-border": design.inputBorderColor,
    "--custom-input-text": design.inputTextColor,
    "--custom-input-radius": `${design.inputBorderRadius}px`,
    "--custom-placeholder-color": design.placeholderColor,
    "--custom-btn-bg": design.buttonBg,
    "--custom-btn-text": design.buttonTextColor,
    "--custom-btn-radius": `${design.buttonBorderRadius}px`,
    "--custom-btn-padding": `${design.buttonPadding}px`,
    "--custom-field-spacing": `${design.fieldSpacing}px`,
  });

  // ── CSS override string applied to preview wrapper ────────────────────────
  const buildPreviewOverrideCss = () => `
    .customized-preview label {
      color: ${design.labelColor} !important;
      font-size: ${design.labelFontSize}px !important;
      font-weight: ${design.labelFontWeight} !important;
    }
    .customized-preview input,
    .customized-preview select,
    .customized-preview textarea {
      background: ${design.inputBg} !important;
      border-color: ${design.inputBorderColor} !important;
      color: ${design.inputTextColor} !important;
      border-radius: ${design.inputBorderRadius}px !important;
    }
    .customized-preview input::placeholder,
    .customized-preview textarea::placeholder {
      color: ${design.placeholderColor} !important;
    }
    .customized-preview .btn-submit,
    .customized-preview .btn-save,
    .customized-preview .btn-next {
      background: ${design.buttonBg} !important;
      color: ${design.buttonTextColor} !important;
      border-radius: ${design.buttonBorderRadius}px !important;
      padding: ${design.buttonPadding}px !important;
    }
    .customized-preview .form-group {
      margin-bottom: ${design.fieldSpacing}px !important;
    }
  `;

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

  // ── RENDER ────────────────────────────────────────────────────────────────
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

      {/* Inline style tag for real-time design overrides */}
      <style dangerouslySetInnerHTML={{ __html: buildPreviewOverrideCss() }} />

      <div className="detail-layout with-customizer">
        
        {/* ── LEFT SIDEBAR: Design Customization Panel ─────────────────── */}
        <div className="sidebar-settings customizer-sidebar">
          
          {/* Panel Tabs */}
          <div className="panel-tabs">
            <button
              type="button"
              className={`panel-tab ${activePanel === "design" ? "active" : ""}`}
              onClick={() => setActivePanel("design")}
            >
              🎨 Design
            </button>
            <button
              type="button"
              className={`panel-tab ${activePanel === "info" ? "active" : ""}`}
              onClick={() => setActivePanel("info")}
            >
              ℹ️ Info
            </button>
          </div>

          {/* ── DESIGN TAB ─────────────────────────────────────────────── */}
          {activePanel === "design" && (
            <div className="customization-panel">
              
              {/* Colors Section */}
              <CollapsibleSection icon="🎨" title="Colors" defaultOpen={true}>
                <ColorControl
                  label="Form Background"
                  value={design.formBg}
                  onChange={(v) => updateDesign("formBg", v)}
                />
                <ColorControl
                  label="Text Color"
                  value={design.formTextColor}
                  onChange={(v) => updateDesign("formTextColor", v)}
                />
                <ColorControl
                  label="Label Color"
                  value={design.labelColor}
                  onChange={(v) => updateDesign("labelColor", v)}
                />
                <ColorControl
                  label="Input Background"
                  value={design.inputBg}
                  onChange={(v) => updateDesign("inputBg", v)}
                />
                <ColorControl
                  label="Input Border"
                  value={design.inputBorderColor}
                  onChange={(v) => updateDesign("inputBorderColor", v)}
                />
                <ColorControl
                  label="Input Text"
                  value={design.inputTextColor}
                  onChange={(v) => updateDesign("inputTextColor", v)}
                />
                <ColorControl
                  label="Placeholder"
                  value={design.placeholderColor}
                  onChange={(v) => updateDesign("placeholderColor", v)}
                />
                <ColorControl
                  label="Button Background"
                  value={design.buttonBg}
                  onChange={(v) => updateDesign("buttonBg", v)}
                />
                <ColorControl
                  label="Button Text"
                  value={design.buttonTextColor}
                  onChange={(v) => updateDesign("buttonTextColor", v)}
                />
              </CollapsibleSection>

              {/* Typography Section */}
              <CollapsibleSection icon="🔤" title="Typography" defaultOpen={false}>
                <SelectControl
                  label="Font Family"
                  value={design.fontFamily}
                  onChange={(v) => updateDesign("fontFamily", v)}
                  options={FONT_OPTIONS}
                />
                <RangeControl
                  label="Font Size"
                  value={design.fontSize}
                  onChange={(v) => updateDesign("fontSize", v)}
                  min={10}
                  max={24}
                />
                <RangeControl
                  label="Label Font Size"
                  value={design.labelFontSize}
                  onChange={(v) => updateDesign("labelFontSize", v)}
                  min={10}
                  max={20}
                />
                <SelectControl
                  label="Label Font Weight"
                  value={design.labelFontWeight}
                  onChange={(v) => updateDesign("labelFontWeight", v)}
                  options={[
                    { value: "400", label: "Normal (400)" },
                    { value: "500", label: "Medium (500)" },
                    { value: "600", label: "Semibold (600)" },
                    { value: "700", label: "Bold (700)" },
                    { value: "800", label: "Extra Bold (800)" },
                  ]}
                />
              </CollapsibleSection>

              {/* Layout & Spacing Section */}
              <CollapsibleSection icon="📐" title="Layout & Spacing" defaultOpen={false}>
                <RangeControl
                  label="Form Width"
                  value={design.formWidth}
                  onChange={(v) => updateDesign("formWidth", v)}
                  min={40}
                  max={100}
                  unit="%"
                />
                <RangeControl
                  label="Form Padding"
                  value={design.formPadding}
                  onChange={(v) => updateDesign("formPadding", v)}
                  min={8}
                  max={64}
                />
                <RangeControl
                  label="Field Spacing"
                  value={design.fieldSpacing}
                  onChange={(v) => updateDesign("fieldSpacing", v)}
                  min={4}
                  max={40}
                />
              </CollapsibleSection>

              {/* Borders & Corners Section */}
              <CollapsibleSection icon="🔲" title="Borders & Corners" defaultOpen={false}>
                <RangeControl
                  label="Form Border Radius"
                  value={design.formBorderRadius}
                  onChange={(v) => updateDesign("formBorderRadius", v)}
                  min={0}
                  max={32}
                />
                <RangeControl
                  label="Form Border Width"
                  value={design.formBorderWidth}
                  onChange={(v) => updateDesign("formBorderWidth", v)}
                  min={0}
                  max={5}
                />
                <ColorControl
                  label="Form Border Color"
                  value={design.formBorderColor}
                  onChange={(v) => updateDesign("formBorderColor", v)}
                />
                <RangeControl
                  label="Input Border Radius"
                  value={design.inputBorderRadius}
                  onChange={(v) => updateDesign("inputBorderRadius", v)}
                  min={0}
                  max={20}
                />
              </CollapsibleSection>

              {/* Button Design Section */}
              <CollapsibleSection icon="🖱️" title="Button Design" defaultOpen={false}>
                <ColorControl
                  label="Button Background"
                  value={design.buttonBg}
                  onChange={(v) => updateDesign("buttonBg", v)}
                />
                <ColorControl
                  label="Button Text Color"
                  value={design.buttonTextColor}
                  onChange={(v) => updateDesign("buttonTextColor", v)}
                />
                <RangeControl
                  label="Button Border Radius"
                  value={design.buttonBorderRadius}
                  onChange={(v) => updateDesign("buttonBorderRadius", v)}
                  min={0}
                  max={24}
                />
                <RangeControl
                  label="Button Padding"
                  value={design.buttonPadding}
                  onChange={(v) => updateDesign("buttonPadding", v)}
                  min={6}
                  max={24}
                />
              </CollapsibleSection>

              {/* Custom CSS Section */}
              <CollapsibleSection icon="💻" title="Custom CSS" defaultOpen={false}>
                <div className="ctrl-group">
                  <div className="ctrl-label">Additional CSS</div>
                  <textarea
                    className="ctrl-css-textarea"
                    value={design.customCss}
                    onChange={(e) => updateDesign("customCss", e.target.value)}
                    placeholder={`/* Example: */\n.form-group label {\n  text-transform: uppercase;\n}`}
                    spellCheck={false}
                  />
                </div>
              </CollapsibleSection>

              {/* Reset All */}
              <button
                type="button"
                className="ctrl-reset-btn"
                onClick={resetDesign}
              >
                ↺ Reset All to Defaults
              </button>
            </div>
          )}

          {/* ── INFO TAB (original sidebar content) ────────────────────── */}
          {activePanel === "info" && (
            <div className="customization-panel">
              <s-heading size="small">About this Template</s-heading>
              <s-paragraph style={{ margin: "8px 0" }} suppressHydrationWarning>
                {template.description}
              </s-paragraph>
              
              <div className="settings-group">
                <s-text suppressHydrationWarning><strong>Category:</strong> <span style={{ textTransform: "capitalize" }}>{template.category}</span></s-text>
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
                <Form method="post" style={{ marginTop: "12px" }} reloadDocument={actionData?.requireFullReload}>
                  <input type="hidden" name="templateId" value={template.id} />
                  <input type="hidden" name="actionType" value={isLocked ? "upgrade" : "use"} />
                  <input type="hidden" name="planToUpgrade" value={template.type === "starter" ? "starter" : "pro"} />
                  
                  {!isLocked ? (
                    <button type="submit" className="plan-btn" style={{ padding: "8px 16px", borderRadius: "8px", background: "#008060", color: "#fff", border: "none", cursor: "pointer" }} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Use Template"}
                    </button>
                  ) : (
                    <button type="submit" className="plan-btn" style={{ padding: "8px 16px", borderRadius: "8px", background: "var(--color-pro)", color: "#fff", border: "none", cursor: "pointer" }} disabled={isSaving}>
                      {isSaving ? "Redirecting..." : "Use Template"}
                    </button>
                  )}
                </Form>

                <s-button onClick={handleReset} variant="tertiary" style={{ marginTop: "8px" }} suppressHydrationWarning>
                  Reset Fields
                </s-button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: The Interactive Form Theme Layout ──────────── */}
        <div className="preview-container customized">
          
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
            <div className="customized-preview">
              {/* Render based on specific template theme with design overrides */}
              
              {/* 1. Newsletter Signup (Free) */}
              {template.styleName === "minimalist-glass" && (
                <form onSubmit={handleFormSubmit} className="form-minimalist-glass" style={buildFormStyle()}>
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
                <form onSubmit={handleFormSubmit} className="form-support-clean" style={buildFormStyle()}>
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
                <form onSubmit={handleFormSubmit} className="form-job-modern" style={buildFormStyle()}>
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
                <div className="audit-wrapper" style={{ borderRadius: `${design.formBorderRadius}px` }}>
                  <div className="audit-header-banner">
                    <h1>Customize audit forms</h1>
                    <div className="audit-tags">
                      <span className="audit-tag">#hassle free</span>
                      <span className="audit-tag">#organized</span>
                      <span className="audit-tag">#time-saver</span>
                    </div>
                  </div>
                  <form onSubmit={handleFormSubmit} className="audit-form-container" style={{ fontFamily: `'${design.fontFamily}', sans-serif`, fontSize: `${design.fontSize}px` }}>
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
                <div className="saas-wrapper" style={{ borderRadius: `${design.formBorderRadius}px` }}>
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
                    <form onSubmit={handleFormSubmit} className="saas-left" style={{ fontFamily: `'${design.fontFamily}', sans-serif`, fontSize: `${design.fontSize}px` }}>
                      <h3>Edit Item settings</h3>
                      {template.fields.map((f) => renderField(f))}
                      <button type="submit" className="btn-save" style={{ marginTop: "12px" }}>
                        {template.submitText}
                      </button>
                    </form>

                    {/* Right: Live Draft Document sheet */}
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
                <form onSubmit={handleFormSubmit} className="form-neon-rsvp" style={buildFormStyle()}>
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
                <form onSubmit={handleFormSubmit} className="form-checkout-premium" style={buildFormStyle()}>
                  <h2>{template.name}</h2>
                  {template.fields.map((f) => renderField(f))}
                  <button type="submit" className="btn-submit">
                    {template.submitText}
                  </button>
                </form>
              )}

              {/* 8. CSAT Feedback (Pro) */}
              {template.styleName === "csat-feedback" && (
                <div className="form-csat-feedback" style={{ borderRadius: `${design.formBorderRadius}px` }}>
                  <div className="csat-header">
                    <h2>{template.name}</h2>
                    <p>{template.subtitle}</p>
                  </div>
                  <form onSubmit={handleFormSubmit} className="csat-body" style={{ fontFamily: `'${design.fontFamily}', sans-serif`, fontSize: `${design.fontSize}px` }}>
                    {template.fields.map((f) => renderField(f))}
                    <button type="submit" className="btn-submit" style={{ marginTop: "12px" }}>
                      {template.submitText}
                    </button>
                  </form>
                </div>
              )}

              {/* 9. Academy Registration (Pro) */}
              {template.styleName === "academy-signup" && (
                <form onSubmit={handleFormSubmit} className="form-academy-signup" style={buildFormStyle()}>
                  <h2>{template.name}</h2>
                  <p className="subtitle">{template.subtitle}</p>
                  {template.fields.map((f) => renderField(f))}
                  <button type="submit" className="btn-submit">
                    {template.submitText}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </s-page>
  );
}
