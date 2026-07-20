"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createChart } from 'lightweight-charts';

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

  // Chart setup
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const candlestickSeriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
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
    
    chart.timeScale().fitContent();

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candlestickSeriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    // Fetch historical data
    const fetchHistory = async () => {
      try {
        const res = await fetch(`https://algo-trading-platform-jwu6.onrender.com/kite/historical/RELIANCE`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === "success") {
            candlestickSeries.setData(json.data);
          }
        }
      } catch (e) {
        console.error("Failed to load historical data", e);
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
          <h3 className="text-xl font-semibold mb-4 text-primary">Live Charts (RELIANCE)</h3>
          <div 
            ref={chartContainerRef} 
            className="w-full h-[400px] border border-secondary/50 rounded bg-background/50 overflow-hidden"
          >
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
