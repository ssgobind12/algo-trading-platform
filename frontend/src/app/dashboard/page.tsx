"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<any[]>([]);
  const [engineStatus, setEngineStatus] = useState("Stopped");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/');
      return;
    }

    // Connect WebSocket
    ws.current = new WebSocket('wss://algo-trading-platform-jwu6.onrender.com/ws');
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'NEW_TRADE') {
        setTrades(prev => [data, ...prev].slice(0, 50));
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [router]);

  const toggleEngine = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const endpoint = engineStatus === 'Stopped' ? '/kite/start_engine' : '/kite/stop_engine';
    
    try {
      const res = await fetch(`https://algo-trading-platform-jwu6.onrender.com${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setEngineStatus(engineStatus === 'Stopped' ? 'Running' : 'Stopped');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Live Dashboard</h1>
        <div className="flex gap-4">
          <button 
            onClick={toggleEngine}
            className={`px-4 py-2 rounded font-bold transition-colors ${engineStatus === 'Running' ? 'bg-danger text-white' : 'bg-accent text-background'}`}
          >
            {engineStatus === 'Running' ? 'Stop Live Engine' : 'Start Live Engine'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 shadow">
          <h3 className="text-lg text-foreground/70 mb-2">Live P&L</h3>
          <p className="text-4xl font-bold text-accent">+ ₹{trades.length * 500}</p>
        </div>
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 shadow">
          <h3 className="text-lg text-foreground/70 mb-2">Daily P&L</h3>
          <p className="text-4xl font-bold text-accent">+ ₹{trades.length * 500}</p>
        </div>
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 shadow">
          <h3 className="text-lg text-foreground/70 mb-2">Active Positions</h3>
          <p className="text-4xl font-bold text-primary">{trades.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl border border-secondary bg-secondary/30 shadow min-h-[400px]">
          <h3 className="text-xl font-semibold mb-4 text-primary">Live Charts (TradingView)</h3>
          <div className="w-full h-[300px] flex items-center justify-center border border-secondary/50 rounded bg-background/50">
            <span className="text-foreground/50">WebSocket Connection Established. Waiting for ticks...</span>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 shadow">
          <h3 className="text-xl font-semibold mb-4 text-primary">Recent Trades</h3>
          <ul className="space-y-4">
            {trades.length === 0 ? (
              <li className="text-foreground/50">No trades yet... waiting for signals.</li>
            ) : (
              trades.map((trade, idx) => (
                <li key={idx} className="flex justify-between items-center pb-2 border-b border-secondary/50">
                  <div>
                    <p className="font-semibold">{trade.symbol}</p>
                    <p className="text-xs text-foreground/70">{trade.side}</p>
                  </div>
                  <p className={trade.side === 'BUY' ? 'text-accent font-mono' : 'text-danger font-mono'}>
                    {trade.quantity} Qty
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
