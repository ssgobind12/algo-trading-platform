import React from 'react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Live Dashboard</h1>
        <div className="flex gap-4">
          <div className="text-sm border border-secondary px-3 py-1 rounded bg-secondary/50">
            Broker Status: <span className="text-accent font-semibold">Connected</span>
          </div>
          <div className="text-sm border border-secondary px-3 py-1 rounded bg-secondary/50">
            Server Status: <span className="text-accent font-semibold">Online</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 shadow">
          <h3 className="text-lg text-foreground/70 mb-2">Live P&L</h3>
          <p className="text-4xl font-bold text-accent">+ ₹12,450.00</p>
        </div>
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 shadow">
          <h3 className="text-lg text-foreground/70 mb-2">Daily P&L</h3>
          <p className="text-4xl font-bold text-accent">+ ₹4,200.00</p>
        </div>
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 shadow">
          <h3 className="text-lg text-foreground/70 mb-2">Active Positions</h3>
          <p className="text-4xl font-bold text-primary">3</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl border border-secondary bg-secondary/30 shadow min-h-[400px]">
          <h3 className="text-xl font-semibold mb-4 text-primary">Live Charts (TradingView)</h3>
          <div className="w-full h-[300px] flex items-center justify-center border border-secondary/50 rounded bg-background/50">
            <span className="text-foreground/50">Chart.js / Lightweight Charts container</span>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 shadow">
          <h3 className="text-xl font-semibold mb-4 text-primary">Recent Trades</h3>
          <ul className="space-y-4">
            <li className="flex justify-between items-center pb-2 border-b border-secondary/50">
              <div>
                <p className="font-semibold">RELIANCE</p>
                <p className="text-xs text-foreground/70">Buy - NSE Intraday</p>
              </div>
              <p className="text-accent font-mono">+ ₹1,200</p>
            </li>
            <li className="flex justify-between items-center pb-2 border-b border-secondary/50">
              <div>
                <p className="font-semibold">GOLD</p>
                <p className="text-xs text-foreground/70">Sell - MCX Gold</p>
              </div>
              <p className="text-danger font-mono">- ₹450</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
