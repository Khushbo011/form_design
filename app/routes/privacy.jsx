export const loader = () => {
  return null;
}

export default function PrivacyPolicy() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "800px", margin: "0 auto", lineHeight: "1.6" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Privacy Policy</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Introduction</h2>
      <p style={{ marginBottom: "1rem" }}>Welcome to our Privacy Policy. This policy describes how our Shopify application ("the App") collects, uses, and shares your personal information when you use it.</p>
      
      <h2 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Information the App Collects</h2>
      <p style={{ marginBottom: "0.5rem" }}>When you install the App, we are automatically able to access certain types of information from your Shopify account:</p>
      <ul style={{ paddingLeft: "2rem", marginBottom: "1rem" }}>
        <li style={{ marginBottom: "0.25rem" }}>Store information (e.g., store name, email address)</li>
        <li style={{ marginBottom: "0.25rem" }}>Customer information (if applicable to the app's functionality)</li>
      </ul>
      
      <h2 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.5rem" }}>How Do We Use Your Personal Information?</h2>
      <p style={{ marginBottom: "1rem" }}>We use the personal information we collect from you and your customers in order to provide the Service and to operate the App securely and efficiently.</p>
      
      <h2 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Data Retention</h2>
      <p style={{ marginBottom: "1rem" }}>When you use our App, we will maintain your Order Information for our records unless and until you ask us to delete this information.</p>
      
      <h2 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Changes</h2>
      <p style={{ marginBottom: "1rem" }}>We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons.</p>
      
      <h2 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.5rem" }}>Contact Us</h2>
      <p style={{ marginBottom: "1rem" }}>For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by email at our support address.</p>
    </div>
  );
}
