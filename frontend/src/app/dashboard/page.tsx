"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createChart, CandlestickSeries } from 'lightweight-charts';

const API_BASE = 'https://algo-trading-platform-jwu6.onrender.com';

export default function DashboardPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<any[]>([]);
  const [engineStatus, setEngineStatus] = useState("Stopped");
  const [chartStatus, setChartStatus] = useState("Loading chart data...");
  const [engineMessage, setEngineMessage] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/');
      return;
    }

    // Connect WebSocket
    const connectWs = () => {
      ws.current = new WebSocket(`wss://algo-trading-platform-jwu6.onrender.com/ws`);
      
      ws.current.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_TRADE') {
          setTrades(prev => [data, ...prev].slice(0, 50));
        }
      };

      ws.current.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected, reconnecting in 5s...");
        setTimeout(connectWs, 5000);
      };
    };

    connectWs();

    return () => {
      ws.current?.close();
    };
  }, [router]);

  // Chart setup
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: 'transparent' },
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
    });
    
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    // Fetch historical data with retry
    const fetchHistory = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          setChartStatus(i === 0 ? `Loading RELIANCE chart data...` : `Retrying... (attempt ${i + 1}/${retries})`);
          const res = await fetch(`${API_BASE}/kite/historical/RELIANCE`);
          
          if (!res.ok) {
            const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
            console.error(`Chart fetch failed:`, errData);
            if (i < retries - 1) {
              setChartStatus(`Server warming up... retrying in 5s`);
              await new Promise(r => setTimeout(r, 5000));
              continue;
            }
            setChartStatus(`Error: ${errData.detail || errData.message || 'Unknown error'}`);
            return;
          }

          const json = await res.json();
          console.log("Chart API response:", json.status, "candles:", json.data?.length);
          
          if (json.status === "success" && json.data && json.data.length > 0) {
            candlestickSeries.setData(json.data);
            chart.timeScale().fitContent();
            setChartStatus("");
            return;
          } else {
            if (i < retries - 1) {
              setChartStatus(`No data yet, retrying in 5s...`);
              await new Promise(r => setTimeout(r, 5000));
              continue;
            }
            setChartStatus(json.message || "No chart data available. Market may be closed.");
            return;
          }
        } catch (e) {
          console.error("Chart fetch error:", e);
          if (i < retries - 1) {
            setChartStatus(`Connection failed. Retrying in 5s...`);
            await new Promise(r => setTimeout(r, 5000));
          } else {
            setChartStatus("Backend is waking up (free tier cold start ~50s). Please refresh the page.");
          }
        }
      }
    };
    fetchHistory();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

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
      
      // Clear message after 5 seconds
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

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Live Dashboard</h1>
        <div className="flex gap-4 items-center">
          {engineMessage && (
            <span className="text-sm text-foreground/70 bg-secondary/50 px-3 py-1 rounded">
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
        <div className="lg:col-span-2 p-6 rounded-xl border border-secondary bg-secondary/30 shadow min-h-[400px]">
          <h3 className="text-xl font-semibold mb-4 text-primary">Live Charts (RELIANCE)</h3>
          <div className="relative">
            <div 
              ref={chartContainerRef} 
              className="w-full h-[400px] border border-secondary/50 rounded bg-background/50 overflow-hidden"
            />
            {chartStatus && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
                <div className="text-center">
                  <div className="animate-pulse text-primary text-lg mb-2">📊</div>
                  <span className="text-foreground/50">{chartStatus}</span>
                </div>
              </div>
            )}
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
