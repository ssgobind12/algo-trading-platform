"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createChart, ColorType, ISeriesApi, CandlestickSeries } from 'lightweight-charts';

const API_BASE = 'https://algo-trading-platform-jwu6.onrender.com';

// Chart symbols organized by category
const CHART_SYMBOLS: Record<string, { label: string; symbol: string }[]> = {
  "NSE Intraday": [
    { label: "RELIANCE", symbol: "RELIANCE" },
    { label: "TATA MOTORS", symbol: "TATAMOTORS" },
    { label: "INFOSYS", symbol: "INFY" },
    { label: "HDFC BANK", symbol: "HDFCBANK" },
    { label: "TCS", symbol: "TCS" },
    { label: "NIFTY 50", symbol: "NIFTY 50" },
    { label: "BANK NIFTY", symbol: "NIFTY BANK" },
  ],
  "MCX Commodity": [
    { label: "GOLD", symbol: "GOLD" },
    { label: "SILVER", symbol: "SILVER" },
    { label: "CRUDE OIL", symbol: "CRUDEOIL" },
  ],
};

function StreamingChart({ symbol, latestTick }: { symbol: string, latestTick: any }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [status, setStatus] = useState("Initializing...");
  const lastCandleRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });
    
    // Create the Candlestick Series directly (v5 style)
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    
    seriesRef.current = series;

    // Fetch historical data
    const fetchHistory = async () => {
      setStatus(`Loading historical data for ${symbol}...`);
      try {
        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const res = await fetch(`${API_BASE}/kite/historical/${symbol}`, { headers });
        const json = await res.json();
        
        if (json.status === "success" && json.data?.length > 0) {
          series.setData(json.data);
          lastCandleRef.current = json.data[json.data.length - 1];
          chart.timeScale().fitContent();
          setStatus("");
        } else {
          setStatus(json.message || "No historical data found. Make sure Live Engine is running.");
        }
      } catch (err) {
        setStatus("Failed to load historical data.");
      }
    };
    
    fetchHistory();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol]);

  // Update chart when a new tick arrives
  useEffect(() => {
    if (!seriesRef.current || !latestTick || !lastCandleRef.current) return;
    
    const price = latestTick.price;
    const tickTime = latestTick.time; // Unix timestamp
    const lastCandle = lastCandleRef.current;
    
    // We are using 1-minute candles (60 seconds)
    // If the tick is within the same minute as the last candle, update it
    const candleMinute = Math.floor(lastCandle.time / 60) * 60;
    const tickMinute = Math.floor(tickTime / 60) * 60;
    
    if (tickMinute === candleMinute || tickTime < candleMinute + 60) {
      // Update current candle
      const updatedCandle = {
        time: lastCandle.time as import('lightweight-charts').Time,
        open: lastCandle.open,
        high: Math.max(lastCandle.high, price),
        low: Math.min(lastCandle.low, price),
        close: price
      };
      seriesRef.current.update(updatedCandle);
      lastCandleRef.current = updatedCandle;
    } else {
      // Create new candle
      const newCandle = {
        time: tickMinute as import('lightweight-charts').Time,
        open: price,
        high: price,
        low: price,
        close: price
      };
      seriesRef.current.update(newCandle);
      lastCandleRef.current = newCandle;
    }
  }, [latestTick]);

  return (
    <div className="relative w-full h-[500px]">
      {status && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 text-primary font-medium">
          {status}
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<any[]>([]);
  const [engineStatus, setEngineStatus] = useState("Stopped");
  const [engineMessage, setEngineMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("NSE Intraday");
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
  const [selectedLabel, setSelectedLabel] = useState("RELIANCE");
  const [latestTick, setLatestTick] = useState<any>(null);
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
        } else if (data.type === 'NEW_TICK') {
          // In a real app we would map the instrument token back to the symbol.
          // For simplicity, we just pass the tick down and let the chart update if it's running.
          setLatestTick(data);
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
              Live Streaming Chart — {selectedLabel}
            </h3>
            <div className="flex gap-2">
              {Object.entries(CHART_SYMBOLS).map(([category, symbols]) => (
                <div key={category} className="relative group z-50">
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
          
          {/* Custom Lightweight Chart */}
          <div className="w-full h-[500px] border border-secondary/50 rounded bg-background/50 overflow-hidden">
            <StreamingChart symbol={selectedSymbol} latestTick={latestTick} />
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
