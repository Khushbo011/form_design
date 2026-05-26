export const FORM_TEMPLATES = [
  {
    id: "newsletter-signup",
    name: "Minimalist Newsletter",
    type: "free",
    category: "marketing",
    description: "Increase subscriber signups with a clean, focused, and high-converting single-field form layout.",
    subtitle: "Grow your audience with zero clutter.",
    styleName: "minimalist-glass",
    fields: [
      {
        id: "email",
        label: "Email Address",
        type: "email",
        placeholder: "alex@example.com",
        required: true,
        helpText: "We respect your privacy. Unsubscribe at any time."
      }
    ],
    submitText: "Subscribe Now",
    successMessage: "Thank you for subscribing! Please check your inbox to confirm."
  },
  {
    id: "customer-support",
    name: "Customer Feedback & Support",
    type: "starter",
    category: "feedback",
    description: "A structured, functional support request form designed to collect customer tickets and inquiries with categorization.",
    subtitle: "Get feedback and resolve issues faster.",
    styleName: "support-clean",
    fields: [
      {
        id: "name",
        label: "Your Name",
        type: "text",
        placeholder: "Jane Doe",
        required: true
      },
      {
        id: "email",
        label: "Email Address",
        type: "email",
        placeholder: "jane.doe@example.com",
        required: true
      },
      {
        id: "category",
        label: "How can we help?",
        type: "select",
        options: ["Billing Inquiry", "Technical Support", "Bug Report", "Feature Request", "General Feedback"],
        required: true
      },
      {
        id: "message",
        label: "Message / Details",
        type: "textarea",
        placeholder: "Please describe your question or issue in detail...",
        required: true
      },
      {
        id: "urgent",
        label: "Is this issue blocking your store operations?",
        type: "checkbox",
        required: false
      }
    ],
    submitText: "Submit Ticket",
    successMessage: "Your support request has been submitted. Our team will contact you shortly!"
  },
  {
    id: "job-application",
    name: "Job Application Form",
    type: "starter",
    category: "operations",
    description: "Elegant layout with default and additional field groups. Perfect for career pages and candidate applications (Eugen Esanu design style).",
    subtitle: "Streamline candidate applications beautifully.",
    styleName: "job-modern",
    fields: [
      {
        id: "name",
        label: "Full Name",
        type: "text",
        placeholder: "E.g. John Smith",
        required: true,
        group: "Default fields"
      },
      {
        id: "email",
        label: "Email",
        type: "email",
        placeholder: "john@company.com",
        required: true,
        group: "Default fields"
      },
      {
        id: "phone",
        label: "Phone number",
        type: "tel",
        placeholder: "+1 (555) 000-0000",
        required: true,
        group: "Default fields"
      },
      {
        id: "desired_employment",
        label: "Desired Employment",
        type: "select",
        options: ["Full-time (40h/week)", "Part-time (20h/week)", "Contractor / Freelance", "Internship"],
        required: true,
        group: "Additional fields"
      },
      {
        id: "desired_schedule",
        label: "Desired Schedule",
        type: "select",
        options: ["Flexible hours", "Standard business hours", "Night shifts", "Weekends"],
        required: true,
        group: "Additional fields"
      },
      {
        id: "experience",
        label: "Describe your work experience",
        type: "textarea",
        placeholder: "Include key achievements, tech stack or past roles...",
        required: true,
        group: "Additional fields"
      }
    ],
    submitText: "Next: Submit Application",
    successMessage: "Application received! Our HR department will review your profile."
  },
  {
    id: "audit-details",
    name: "Custom Audit Form",
    type: "starter",
    category: "operations",
    description: "Detailed, structured form designed for field audits, inspections, or product logs (Yuktha Mukhi design style).",
    subtitle: "Maintain consistency across audits easily.",
    styleName: "audit-blue",
    fields: [
      {
        id: "location",
        label: "Location",
        type: "text",
        placeholder: "Enter Location",
        required: true
      },
      {
        id: "auditor_name",
        label: "Auditor Name",
        type: "text",
        placeholder: "Enter Name",
        required: true
      },
      {
        id: "date",
        label: "Date",
        type: "date",
        required: true
      },
      {
        id: "notes",
        label: "General Audit Notes",
        type: "textarea",
        placeholder: "Write observation comments here...",
        required: false
      }
    ],
    submitText: "Start Audit",
    successMessage: "Audit details logged successfully. Opening audit sheet..."
  },
  {
    id: "saas-settings",
    name: "SaaS Product & Item Settings",
    type: "pro",
    category: "marketing",
    description: "Form builder with interactive modifier settings and side-by-side live draft document visual output (Monty Hayton design style).",
    subtitle: "Build complex products with instant feedback.",
    styleName: "saas-dashboard",
    fields: [
      {
        id: "name",
        label: "Name",
        type: "text",
        placeholder: "Burger Rings",
        required: true
      },
      {
        id: "product_type",
        label: "Product Type",
        type: "select",
        options: ["Burgers", "Add-on", "Drinks", "Desserts", "Custom Select"],
        required: true
      },
      {
        id: "description",
        label: "Description",
        type: "textarea",
        placeholder: "In publishing and graphic design, Lorem ipsum is a placeholder text commonly used...",
        required: true
      }
    ],
    submitText: "Save Changes",
    successMessage: "SaaS platform product settings updated successfully!"
  },
  {
    id: "neon-rsvp",
    name: "Neon RSVP & Event Reservation",
    type: "pro",
    category: "event",
    description: "Stunning dark-mode event invitation RSVP with glowing input fields, micro-interactions, and premium glass cards.",
    subtitle: "Make your event feel exclusive from the first click.",
    styleName: "neon-event",
    fields: [
      {
        id: "name",
        label: "Full Name",
        type: "text",
        placeholder: "Gavin Belson",
        required: true
      },
      {
        id: "email",
        label: "Email Address",
        type: "email",
        placeholder: "gavin@hooli.xyz",
        required: true
      },
      {
        id: "guests",
        label: "Number of Guests (including you)",
        type: "select",
        options: ["1 Guest", "2 Guests", "3 Guests", "4 Guests", "5+ Guests"],
        required: true
      },
      {
        id: "dietary",
        label: "Dietary Restrictions / Accommodations",
        type: "textarea",
        placeholder: "None, vegan, gluten-free, wheelchair access, etc.",
        required: false
      }
    ],
    submitText: "Secure My Invite",
    successMessage: "RSVP Confirmed! Check your email for your digital ticket and entry pass."
  },
  {
    id: "checkout-order",
    name: "Premium Order Form",
    type: "pro",
    category: "operations",
    description: "Sleek ordering form with fields for customer details, shipping address, zip code, and products count selection.",
    subtitle: "Direct-to-consumer purchase form.",
    styleName: "checkout-premium",
    fields: [
      {
        id: "customer_name",
        label: "Recipient Name",
        type: "text",
        placeholder: "Rich Hendrick",
        required: true
      },
      {
        id: "shipping_address",
        label: "Delivery Address",
        type: "text",
        placeholder: "123 Main St, Palo Alto",
        required: true
      },
      {
        id: "city",
        label: "City",
        type: "text",
        placeholder: "Palo Alto",
        required: true
      },
      {
        id: "zipcode",
        label: "Zip Code / Postal Code",
        type: "text",
        placeholder: "94301",
        required: true
      },
      {
        id: "quantity",
        label: "Select Product Quantity",
        type: "select",
        options: ["1 unit", "2 units", "3 units", "5 units", "10+ bulk pack"],
        required: true
      }
    ],
    submitText: "Place Order",
    successMessage: "Order placed successfully! A confirmation invoice has been sent."
  },
  {
    id: "csat-feedback",
    name: "CSAT Feedback Form",
    type: "pro",
    category: "feedback",
    description: "Measure customer satisfaction after purchase with friendly emoji feedback ratings and descriptive review logs.",
    subtitle: "Understand how your store is performing.",
    styleName: "csat-feedback",
    fields: [
      {
        id: "rating",
        label: "How would you rate your overall experience?",
        type: "select",
        options: ["5 - Excellent 😊", "4 - Good 🙂", "3 - Average 😐", "2 - Poor 🙁", "1 - Terrible 😠"],
        required: true
      },
      {
        id: "review_title",
        label: "Feedback Title",
        type: "text",
        placeholder: "E.g. Great checkout speed!",
        required: true
      },
      {
        id: "review_body",
        label: "Tell us more details",
        type: "textarea",
        placeholder: "What went well? What can we improve?",
        required: false
      }
    ],
    submitText: "Submit Feedback",
    successMessage: "Feedback submitted. Thank you for helping us improve our shop!"
  },
  {
    id: "academy-signup",
    name: "Academy Registration Form",
    type: "pro",
    category: "event",
    description: "Elegant enrollment sheet for workshops, classes, or webinars with student dob and subject tracking details.",
    subtitle: "Simplify course enrollments.",
    styleName: "academy-signup",
    fields: [
      {
        id: "student_name",
        label: "Student Name",
        type: "text",
        placeholder: "E.g. Richard Hendricks",
        required: true
      },
      {
        id: "dob",
        label: "Date of Birth",
        type: "date",
        required: true
      },
      {
        id: "subject",
        label: "Select Subject of Interest",
        type: "select",
        options: ["Shopify App Development", "UI/UX Front-End Design", "API Integrations", "Database Architecture"],
        required: true
      },
      {
        id: "session_time",
        label: "Preferred Session",
        type: "select",
        options: ["Morning class (9 AM - 12 PM)", "Afternoon class (2 PM - 5 PM)", "Evening webinar (7 PM - 9 PM)"],
        required: true
      }
    ],
    submitText: "Confirm Enrollment",
    successMessage: "Registration complete! Check your email for course resources and links."
  }
];
