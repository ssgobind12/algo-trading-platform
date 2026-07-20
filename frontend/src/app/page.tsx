import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-10">
        <h1 className="text-5xl font-bold tracking-tight text-primary">SS Gobind Algo Trading</h1>
      </div>
      
      <p className="text-xl text-center max-w-2xl text-foreground/80 mb-16">
        A production-ready AI-powered Algorithmic Trading Platform supporting NSE and MCX via Zerodha Kite Connect.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
        <Link href="/dashboard" className="group rounded-xl border border-secondary bg-secondary/30 px-6 py-8 transition-all hover:border-primary hover:bg-secondary/70 shadow-lg">
          <h2 className="mb-3 text-2xl font-semibold text-primary">
            Dashboard <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
          </h2>
          <p className="m-0 text-sm opacity-70">
            View live portfolio, real-time P&L, charts and active trades.
          </p>
        </Link>
        <Link href="/strategies" className="group rounded-xl border border-secondary bg-secondary/30 px-6 py-8 transition-all hover:border-accent hover:bg-secondary/70 shadow-lg">
          <h2 className="mb-3 text-2xl font-semibold text-accent">
            Strategies <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
          </h2>
          <p className="m-0 text-sm opacity-70">
            Manage AI-powered trading algorithms and backtest results.
          </p>
        </Link>
        <Link href="/admin" className="group rounded-xl border border-secondary bg-secondary/30 px-6 py-8 transition-all hover:border-danger hover:bg-secondary/70 shadow-lg">
          <h2 className="mb-3 text-2xl font-semibold text-danger">
            Admin Panel <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
          </h2>
          <p className="m-0 text-sm opacity-70">
            Manage users, configure brokers, and monitor system health.
          </p>
        </Link>
      </div>
    </main>
  );
}
