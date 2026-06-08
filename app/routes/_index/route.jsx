import { redirect, Form, useLoaderData } from "react-router";
import { login, authenticate } from "../../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    await authenticate.admin(request);
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();
  
  const features = [
    {
      title: "Drag & Drop Form Builder",
      description: "Visual controls to design, arrange, and edit form fields in real-time.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5V3.75H3.75Zm5.25 6h6m-6 3.75h6m-6 3.75h3.75" />
        </svg>
      ),
    },
    {
      title: "No Coding Required",
      description: "Build clean, professional store forms in minutes without touching theme liquid code.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
      ),
    },
    {
      title: "Shopify Integrated",
      description: "Sync submission data, contacts, and customer profiles straight into your store database.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615 3.001 3.001 0 0 0 3.75.615 3.001 3.001 0 0 0 3.75-.615 3.001 3.001 0 0 0 3.75.615 3.001 3.001 0 0 0 3.75-.615m-15 0h15M2.25 9.35 12 2.75l9.75 6.6" />
        </svg>
      ),
    },
    {
      title: "Responsive Design",
      description: "Forms automatically adapt to look clean, fast, and optimized on any mobile screen.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18h9" />
        </svg>
      ),
    },
    {
      title: "Custom Styling",
      description: "Tailor styles, input colors, button fields, layouts, and fonts to match your store branding.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122A3 3 0 0 0 10.5 21.5h3.75a3 3 0 0 0 .97-5.378m-5.69-1.242a8.995 8.995 0 0 1-2.03-3.63m7.72 3.63a8.996 8.996 0 0 0 2.03-3.63m-9.75-3.63A8.969 8.969 0 0 1 12 3c1.726 0 3.298.486 4.63 1.33m-9.75 3.63H17.25m-9.75 3.63H17.25" />
        </svg>
      ),
    },
    {
      title: "Instant Deployment",
      description: "Activate forms in your live theme pages instantly with a single toggle.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.63 8.41a14.97 14.97 0 0 0-2.58 5.84m8.54-1.88a14.99 14.99 0 0 0-8.54 1.88m0 0A14.98 14.98 0 0 0 2.37 21.63a14.98 14.98 0 0 0 12.12-6.16m-4.8-1.1a14.96 14.96 0 0 0-5.84-2.58" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#030611] text-white antialiased">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes glow-line {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s infinite ease-in-out;
        }
        .glow-border:focus-within {
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 0 25px rgba(16, 185, 129, 0.15);
        }
      `}} />
      
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.22),transparent_25%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.22),transparent_25%),radial-gradient(circle_at_50%_75%,rgba(139,92,246,0.12),transparent_35%),linear-gradient(180deg,#030611_0%,#090f2b_55%,#030611_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
        <div className="absolute left-1/2 top-10 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl animate-pulse-slow" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <nav className="flex items-center justify-between py-5 sm:py-7">
          <a href="/" className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl transition duration-300 group-hover:border-emerald-500/30">
              <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <rect x="3" y="3" width="26" height="26" rx="6" stroke="url(#logo-grad)" strokeWidth="2.5" fill="none" />
                <path d="M9 10H23" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M9 16H23" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M9 22H17" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="23" cy="22" r="2.5" fill="#10B981" />
              </svg>
            </span>
            <span className="text-base font-extrabold tracking-tight text-white transition duration-300 group-hover:text-emerald-400">
              Form Design
            </span>
          </a>

          {showForm && (
            <a
              className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/10"
              href="#login"
            >
              Sign In
            </a>
          )}
        </nav>

        {/* Hero Section */}
        <main className="flex flex-1 flex-col py-8 sm:py-12 lg:py-16">
          <section className="grid min-h-[calc(100vh-220px)] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] pb-16">
            
            {/* Left Content */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
                Premium Shopify Form Builder App
              </div>

              <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Create Professional Shopify Forms <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">Without Coding</span>
              </h1>
              
              <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-slate-300 sm:text-lg">
                Build contact forms, registration forms, lead generation forms, and custom store forms in minutes.
              </p>

              {showForm && (
                <Form
                  id="login"
                  className="mt-8 w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-2.5 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl transition duration-300 hover:border-emerald-500/20 focus-within:border-emerald-500/30"
                  method="post"
                  action="/auth/login"
                >
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <label className="sr-only" htmlFor="shop">
                      Shopify Store Domain
                    </label>
                    
                    <div className="glow-border flex min-w-0 flex-1 items-center rounded-2xl border border-white/5 bg-black/30 px-4 py-3.5 transition duration-300">
                      <span className="mr-2 text-sm font-semibold text-slate-500 select-none">
                        https://
                      </span>
                      <input
                        id="shop"
                        className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                        type="text"
                        name="shop"
                        placeholder="your-store.myshopify.com"
                        required
                      />
                    </div>
                    
                    <button
                      className="cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      type="submit"
                    >
                      Start Building Forms
                    </button>
                  </div>
                </Form>
              )}

              <div className="mt-6 flex flex-wrap justify-center gap-2.5 text-xs font-semibold text-slate-400 lg:justify-start">
                <span className="rounded-full border border-white/5 bg-white/[0.03] px-3.5 py-1.5 backdrop-blur-sm">
                  ✓ Unlimited Responses
                </span>
                <span className="rounded-full border border-white/5 bg-white/[0.03] px-3.5 py-1.5 backdrop-blur-sm">
                  ✓ Custom CSS Variables
                </span>
                <span className="rounded-full border border-white/5 bg-white/[0.03] px-3.5 py-1.5 backdrop-blur-sm">
                  ✓ Auto-Tagging
                </span>
              </div>
            </div>

            {/* Right Interactive Visual Mockup */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-emerald-500/15 via-blue-500/5 to-purple-500/15 blur-2xl animate-pulse-slow" />
              
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-3xl shadow-black/50 backdrop-blur-3xl">
                
                {/* Visual Builder Header bar */}
                <div className="flex items-center justify-between border-b border-white/5 px-2 pb-3 mb-3">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                    <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/20">
                    Form Design Live Canvas
                  </span>
                </div>

                {/* Main Simulator split view */}
                <div className="grid grid-cols-[120px_1fr] gap-3 rounded-2xl bg-[#070b19] p-3">
                  
                  {/* Left Mock Builder Controls */}
                  <div className="flex flex-col gap-2 border-r border-white/5 pr-2.5">
                    <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">Field Blocks</div>
                    
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] p-2 border border-white/5 text-[9px] text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Text Input
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] p-2 border border-white/5 text-[9px] text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Email Block
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] p-2 border border-white/5 text-[9px] text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Checkbox
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] p-2 border border-white/5 text-[9px] text-emerald-300 border-dashed border-emerald-500/30">
                      + Add New
                    </div>
                  </div>

                  {/* Right Mock Form Design Output */}
                  <div className="rounded-xl bg-slate-950/70 p-4 border border-white/5">
                    <div className="mx-auto max-w-xs text-center mb-4">
                      <div className="h-1 w-10 bg-emerald-400 rounded-full mx-auto mb-2" />
                      <h4 className="text-xs font-bold">Contact Support</h4>
                      <p className="text-[8px] text-slate-400 mt-1">Get in touch with our operations team.</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="h-2 w-12 bg-white/20 rounded-full mb-1.5" />
                        <div className="h-8 w-full bg-white/5 rounded-lg border border-white/10" />
                      </div>
                      <div>
                        <div className="h-2 w-16 bg-white/20 rounded-full mb-1.5" />
                        <div className="h-8 w-full bg-white/5 rounded-lg border border-white/10" />
                      </div>
                      <div className="pt-2">
                        <div className="h-8 w-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-md shadow-emerald-500/10">
                          Submit Details
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            
          </section>

          {/* Features Grid */}
          <section className="border-t border-white/5 pt-16 pb-12">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                Everything You Need to Design Perfect Forms
              </h2>
              <p className="mt-3 text-sm text-slate-400 max-w-xl mx-auto">
                No complex coding, just drag-and-drop components optimized directly for Shopify merchants.
              </p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article
                  className="group rounded-3xl border border-white/5 bg-white/[0.02] p-6 text-left shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-emerald-500/25 hover:bg-white/[0.04]"
                  key={feature.title}
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.08] to-white/[0.02] text-emerald-300 shadow-md transition duration-300 group-hover:scale-105 group-hover:text-emerald-200">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white transition duration-300 group-hover:text-emerald-300">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-slate-400">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/5 py-8 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Form Design. Built for the Shopify ecosystem.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400">Premium Templates</span>
            <span>•</span>
            <span className="hover:text-slate-400">Instant Publishing</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
