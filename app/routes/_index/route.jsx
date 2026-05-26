import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();
  const features = [
    {
      title: "Drag & Drop Builder",
      description:
        "Compose polished hero sections with reusable blocks, campaign presets, and smooth controls.",
      icon: (
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
          />
        </svg>
      ),
    },
    {
      title: "Fast Shopify Integration",
      description:
        "Connect your store and publish campaign-ready sections without touching theme code.",
      icon: (
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"
          />
        </svg>
      ),
    },
    {
      title: "Mobile Responsive Design",
      description:
        "Launch sections that stay sharp, fast, and conversion-focused across every screen.",
      icon: (
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 18h4M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#02040a] text-white antialiased">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(37,99,235,0.38),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(168,85,247,0.34),transparent_26%),radial-gradient(circle_at_50%_70%,rgba(20,184,166,0.14),transparent_34%),linear-gradient(180deg,#02040a_0%,#070a16_50%,#02040a_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-4 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-5 sm:py-7">
          <a href="/" className="group flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
              <span className="h-5 w-5 rounded-lg bg-gradient-to-br from-emerald-300 via-sky-400 to-violet-500 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
            </span>
            <span className="text-sm font-semibold tracking-wide text-white sm:text-base">
              HeroCraft
            </span>
          </a>

          {showForm && (
            <a
              className="hidden rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15 hover:shadow-lg hover:shadow-blue-500/20 sm:block"
              href="#login"
            >
              Login
            </a>
          )}
        </nav>

        <main className="flex flex-1 flex-col py-10 sm:py-14 lg:py-16">
          <section className="grid min-h-[calc(100vh-190px)] items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center lg:items-start lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-medium text-slate-300 shadow-2xl shadow-violet-950/20 backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
                Shopify hero builder for premium stores
              </div>

              <h1 className="max-w-4xl text-balance text-5xl font-black leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
                Create Premium Shopify Hero Sections
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-slate-300 sm:text-xl">
                Design stunning animated hero sections for your Shopify store in
                minutes.
              </p>

              {showForm && (
                <Form
                  id="login"
                  className="mt-10 w-full max-w-2xl rounded-[1.75rem] border border-white/10 bg-white/[0.08] p-3 shadow-2xl shadow-violet-950/30 backdrop-blur-xl transition duration-300 hover:border-white/20"
                  method="post"
                  action="/auth/login"
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="sr-only" htmlFor="shop">
                      Shop domain
                    </label>
                    <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-white/10 bg-black/40 px-4 py-3 transition duration-300 focus-within:border-cyan-300/60 focus-within:bg-black/55 focus-within:shadow-[0_0_0_4px_rgba(34,211,238,0.14)]">
                      <span className="mr-3 text-sm font-medium text-slate-500">
                        https://
                      </span>
                      <input
                        id="shop"
                        className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
                        type="text"
                        name="shop"
                        placeholder="my-shop-domain.myshopify.com"
                      />
                    </div>
                    <button
                      className="rounded-2xl bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition duration-300 hover:-translate-y-0.5 hover:shadow-blue-500/30 focus:outline-none focus:ring-4 focus:ring-cyan-400/25"
                      type="submit"
                    >
                      Login
                    </button>
                  </div>
                </Form>
              )}

              <div className="mt-7 flex flex-wrap justify-center gap-3 text-xs font-medium text-slate-400 lg:justify-start">
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
                  No-code sections
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
                  Animated layouts
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
                  Shopify ready
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-violet-500/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.08] p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-2 pb-4">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-300" />
                    <span className="h-3 w-3 rounded-full bg-emerald-300" />
                  </div>
                  <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Live hero preview
                  </span>
                </div>

                <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-[#07111f] p-5">
                  <div className="rounded-[1.25rem] bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950 p-6">
                    <div className="mb-10 flex items-center justify-between">
                      <div className="h-3 w-24 rounded-full bg-white/25" />
                      <div className="flex gap-2">
                        <div className="h-3 w-10 rounded-full bg-white/15" />
                        <div className="h-3 w-10 rounded-full bg-white/15" />
                      </div>
                    </div>
                    <div className="max-w-sm">
                      <div className="mb-3 h-3 w-28 rounded-full bg-cyan-300/70" />
                      <div className="mb-3 h-8 w-full rounded-lg bg-white/90" />
                      <div className="mb-6 h-8 w-3/4 rounded-lg bg-white/70" />
                      <div className="space-y-2">
                        <div className="h-3 w-full rounded-full bg-white/20" />
                        <div className="h-3 w-4/5 rounded-full bg-white/15" />
                      </div>
                      <div className="mt-7 flex gap-3">
                        <div className="h-11 w-32 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" />
                        <div className="h-11 w-24 rounded-full border border-white/20 bg-white/10" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                      <div className="mb-3 h-8 w-8 rounded-xl bg-cyan-300/20" />
                      <div className="h-2 w-full rounded-full bg-white/20" />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                      <div className="mb-3 h-8 w-8 rounded-xl bg-violet-300/20" />
                      <div className="h-2 w-full rounded-full bg-white/20" />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                      <div className="mb-3 h-8 w-8 rounded-xl bg-emerald-300/20" />
                      <div className="h-2 w-full rounded-full bg-white/20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid w-full gap-5 pb-8 sm:grid-cols-3">
            {features.map((feature) => (
              <article
                className="group rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 text-left shadow-2xl shadow-black/20 backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-cyan-300/30 hover:bg-white/[0.09]"
                key={feature.title}
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/15 to-white/5 text-cyan-200 shadow-lg shadow-blue-950/20 transition duration-300 group-hover:scale-105 group-hover:text-white">
                  {feature.icon}
                </div>
                <h2 className="text-xl font-bold tracking-normal text-white">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </section>
        </main>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-sm text-slate-500 sm:flex-row">
          <p>HeroCraft for Shopify merchants</p>
          <p>Premium sections. Faster launches.</p>
        </footer>
      </div>
    </div>
  );
}
