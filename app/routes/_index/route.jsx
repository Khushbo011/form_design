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
        "Compose polished store hero sections with intuitive controls and premium presets.",
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
        "Connect your store quickly and start publishing campaign-ready sections.",
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
        "Launch sections that feel sharp on phones, tablets, and desktop storefronts.",
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
    <div className="min-h-screen overflow-hidden bg-black text-white antialiased">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.36),transparent_32%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.28),transparent_30%),linear-gradient(180deg,#030712_0%,#050816_48%,#000_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-5 sm:py-7">
          <a href="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 shadow-lg shadow-violet-950/30 backdrop-blur">
              <span className="h-4 w-4 rounded-md bg-gradient-to-br from-emerald-300 via-sky-400 to-violet-500 transition-transform duration-300 group-hover:scale-110" />
            </span>
            <span className="text-sm font-semibold tracking-wide text-white sm:text-base">
              HeroCraft
            </span>
          </a>

          {showForm && (
            <a
              className="hidden rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur transition duration-300 hover:border-white/30 hover:bg-white/15 hover:shadow-violet-500/20 sm:block"
              href="#login"
            >
              Login
            </a>
          )}
        </nav>

        <main className="flex flex-1 flex-col items-center justify-center py-12 sm:py-16 lg:py-20">
          <section className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-medium text-slate-300 shadow-2xl shadow-violet-950/20 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)]" />
              Built for modern Shopify storefronts
            </div>

            <h1 className="max-w-4xl text-balance text-4xl font-black leading-tight tracking-normal text-white sm:text-6xl lg:text-7xl">
              Create Premium Shopify Hero Sections
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-slate-300 sm:text-xl">
              Design stunning animated hero sections for your Shopify store in
              minutes.
            </p>

            {showForm && (
              <Form
                id="login"
                className="mt-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.08] p-3 shadow-2xl shadow-violet-950/30 backdrop-blur-xl transition duration-300 hover:border-white/20"
                method="post"
                action="/auth/login"
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="sr-only" htmlFor="shop">
                    Shop domain
                  </label>
                  <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-white/10 bg-black/35 px-4 py-3 transition duration-300 focus-within:border-violet-300/60 focus-within:bg-black/50 focus-within:shadow-[0_0_0_4px_rgba(139,92,246,0.16)]">
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
                    className="rounded-2xl bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition duration-300 hover:-translate-y-0.5 hover:shadow-blue-500/25 focus:outline-none focus:ring-4 focus:ring-violet-400/30"
                    type="submit"
                  >
                    Login
                  </button>
                </div>
              </Form>
            )}
          </section>

          <section className="mt-16 grid w-full max-w-6xl gap-5 sm:grid-cols-3 lg:mt-20">
            {features.map((feature) => (
              <article
                className="group rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-left shadow-2xl shadow-black/20 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-violet-300/30 hover:bg-white/[0.09]"
                key={feature.title}
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/15 to-white/5 text-cyan-200 shadow-lg shadow-violet-950/20 transition duration-300 group-hover:scale-105 group-hover:text-white">
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
