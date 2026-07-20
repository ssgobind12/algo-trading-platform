import React from 'react';

export default function StrategiesPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-accent">AI Strategies Manager</h1>
        <p className="text-foreground/70">Manage, backtest, and deploy your algorithmic trading strategies.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 flex justify-between items-center transition-all hover:border-primary">
          <div>
            <h2 className="text-xl font-semibold mb-1">NSE Intraday (5m)</h2>
            <p className="text-sm text-foreground/70 mb-3">RSI + MACD + 20 EMA + VWAP</p>
            <div className="flex gap-2">
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Win Rate: 65%</span>
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">Sharpe: 1.8</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded shadow transition-colors">Start Live Trading</button>
            <button className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded shadow transition-colors border border-secondary">Run Backtest</button>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 flex justify-between items-center transition-all hover:border-primary">
          <div>
            <h2 className="text-xl font-semibold mb-1">MCX Gold (15m)</h2>
            <p className="text-sm text-foreground/70 mb-3">After 6 PM IST Strategy</p>
            <div className="flex gap-2">
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Win Rate: 58%</span>
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">Sharpe: 1.4</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="bg-secondary/50 text-foreground/50 px-4 py-2 rounded cursor-not-allowed">Start Live Trading</button>
            <button className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded shadow transition-colors border border-secondary">Run Backtest</button>
          </div>
        </div>
      </div>
    </div>
  );
}
