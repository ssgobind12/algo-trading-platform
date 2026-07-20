"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = 'https://algo-trading-platform-jwu6.onrender.com';

// Chart symbols organized by category
const CHART_SYMBOLS: Record<string, { label: string; symbol: string }[]> = {
  "NSE Intraday": [
    { label: "RELIANCE", symbol: "NSE:RELIANCE" },
    { label: "TATA MOTORS", symbol: "NSE:TATAMOTORS" },
    { label: "INFOSYS", symbol: "NSE:INFY" },
    { label: "HDFC BANK", symbol: "NSE:HDFCBANK" },
    { label: "TCS", symbol: "NSE:TCS" },
    { label: "NIFTY 50", symbol: "NSE:NIFTY" },
    { label: "BANK NIFTY", symbol: "NSE:BANKNIFTY" },
  ],
  "MCX Commodity": [
    { label: "GOLD", symbol: "MCX:GOLD1!" },
    { label: "SILVER", symbol: "MCX:SILVER1!" },
    { label: "CRUDE OIL", symbol: "MCX:CRUDEOIL1!" },
    { label: "NATURAL GAS", symbol: "MCX:NATURALGAS1!" },
    { label: "COPPER", symbol: "MCX:COPPER1!" },
  ],
};

function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous widget
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "5",
      timezone: "Asia/Kolkata",
      theme: "dark",
      style: "1",
      locale: "en",
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      backgroundColor: "rgba(0, 0, 0, 0)",
      gridColor: "rgba(42, 46, 57, 0.3)",
      studies: [
        "RSI@tv-basicstudies",
        "MAExp@tv-basicstudies"
      ],
    });
    
    containerRef.current.appendChild(script);
  }, [symbol]);
  
  return (
    <div className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<any[]>([]);
  const [engineStatus, setEngineStatus] = useState("Stopped");
  const [engineMessage, setEngineMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("NSE Intraday");
  const [selectedSymbol, setSelectedSymbol] = useState("NSE:RELIANCE");
  const [selectedLabel, setSelectedLabel] = useState("RELIANCE");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/');
      return;
    }

    // Connect WebSocket with auto-reconnect
    const connectWs = () => {
      ws.current = new WebSocket(`wss://algo-trading-platform-jwu6.onrender.com/ws`);
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_TRADE') {
          setTrades(prev => [data, ...prev].slice(0, 50));
        }
      };

      ws.current.onclose = () => {
        setTimeout(connectWs, 5000);
      };
    };

    connectWs();

    return () => {
      ws.current?.close();
    };
  }, [router]);

  const toggleEngine = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const endpoint = engineStatus === 'Stopped' ? '/kite/start_engine' : '/kite/stop_engine';
    
    try {
      setEngineMessage("Connecting...");
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setEngineStatus(engineStatus === 'Stopped' ? 'Running' : 'Stopped');
        setEngineMessage(data.message || "Success");
      } else {
        setEngineMessage(data.detail || "Failed to toggle engine");
      }
      
      setTimeout(() => setEngineMessage(""), 5000);
    } catch (err: any) {
      setEngineMessage("Network error. Backend may be waking up.");
      setTimeout(() => setEngineMessage(""), 5000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/');
  };

  const handleSymbolChange = (category: string, symbol: string, label: string) => {
    setSelectedCategory(category);
    setSelectedSymbol(symbol);
    setSelectedLabel(label);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Live Dashboard</h1>
        <div className="flex gap-4 items-center">
          {engineMessage && (
            <span className="text-sm text-foreground/70 bg-secondary/50 px-3 py-1 rounded animate-pulse">
              {engineMessage}
            </span>
          )}
          <button 
            onClick={toggleEngine}
            className={`px-4 py-2 rounded font-bold transition-colors ${engineStatus === 'Running' ? 'bg-danger text-white' : 'bg-accent text-background'}`}
          >
            {engineStatus === 'Running' ? '⏹ Stop Live Engine' : '▶ Start Live Engine'}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded font-bold bg-secondary text-foreground/70 hover:bg-secondary/80 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 shadow">
          <h3 className="text-lg text-foreground/70 mb-2">Live P&L</h3>
          <p className="text-4xl font-bold text-accent">+ ₹{(trades.length * 500).toLocaleString()}</p>
        </div>
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 shadow">
          <h3 className="text-lg text-foreground/70 mb-2">Daily P&L</h3>
          <p className="text-4xl font-bold text-accent">+ ₹{(trades.length * 500).toLocaleString()}</p>
        </div>
        <div className="p-6 rounded-xl border border-secondary bg-secondary/30 shadow">
          <h3 className="text-lg text-foreground/70 mb-2">Active Positions</h3>
          <p className="text-4xl font-bold text-primary">{trades.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl border border-secondary bg-secondary/30 shadow">
          {/* Chart Header with Dropdown */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-primary">
              Live Chart — {selectedLabel}
            </h3>
            <div className="flex gap-2">
              {Object.entries(CHART_SYMBOLS).map(([category, symbols]) => (
                <div key={category} className="relative group">
                  <button className={`px-3 py-1.5 text-sm rounded font-medium transition-colors ${
                    selectedCategory === category 
                      ? 'bg-primary text-background' 
                      : 'bg-secondary/50 text-foreground/70 hover:bg-secondary'
                  }`}>
                    {category} ▾
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-secondary border border-secondary rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
                    {symbols.map((s) => (
                      <button
                        key={s.symbol}
                        onClick={() => handleSymbolChange(category, s.symbol, s.label)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-primary/20 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          selectedSymbol === s.symbol ? 'text-primary font-bold' : 'text-foreground/80'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* TradingView Chart */}
          <div className="w-full h-[500px] border border-secondary/50 rounded bg-background/50 overflow-hidden">
            <TradingViewChart symbol={selectedSymbol} />
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
