'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const WS_URL = typeof window !== 'undefined' ? `ws://${window.location.hostname}:3001` : '';
const CHART_WINDOW = 60; // seconds
const TIMEFRAMES = [
  { label: 'All', value: 0 },
  { label: 'Last 1 min', value: 1 },
  { label: 'Last 5 min', value: 5 },
  { label: 'Last 15 min', value: 15 },
  { label: 'Last 1 hour', value: 60 },
];

export default function Home() {
  const { metrics, errorLogs, isConnected } = useWebSocket(WS_URL);
  const [chartData, setChartData] = useState<{time: string, incoming: number, processed: number}[]>([]);
  const lastMetrics = useRef(metrics);

  // Filter states
  const [searchApplicant, setSearchApplicant] = useState('');
  const [errorType, setErrorType] = useState('');
  const [timeframe, setTimeframe] = useState(0);

  // Get unique error types for dropdown
  const errorTypes = Array.from(new Set(errorLogs.map(log => log.errorType))).filter(Boolean);

  // Filtering logic
  const filteredLogs = errorLogs.filter(log => {
    const matchesApplicant = searchApplicant === '' || (log.applicantId || '').toLowerCase().includes(searchApplicant.toLowerCase());
    const matchesType = errorType === '' || log.errorType === errorType;
    const matchesTime = timeframe === 0 || (Date.now() - new Date(log.timestamp).getTime()) / 60000 <= timeframe;
    return matchesApplicant && matchesType && matchesTime;
  });

  useEffect(() => {
    // Only update if metrics actually change
    if (
      metrics.incoming !== lastMetrics.current.incoming ||
      metrics.processed !== lastMetrics.current.processed
    ) {
      setChartData((prev) => {
        const now = new Date();
        const time = now.toLocaleTimeString();
        const newEntry = {
          time,
          incoming: metrics.incoming,
          processed: metrics.processed
        };
        const updated = [...prev, newEntry];
        // Keep only the last CHART_WINDOW entries
        return updated.slice(-CHART_WINDOW);
      });
      lastMetrics.current = metrics;
    }
  }, [metrics]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-gray-900 text-white">
      <div className="w-full max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Loan Processing Dashboard</h1>
          <span className={`ml-4 px-3 py-1 rounded text-sm ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}>{isConnected ? 'Live' : 'Disconnected'}</span>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-lg">Incoming</div>
            <div className="text-2xl font-bold">{metrics.incoming}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-lg">Processed</div>
            <div className="text-2xl font-bold">{metrics.processed}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <div className="text-lg">Failed</div>
            <div className="text-2xl font-bold">{metrics.failed}</div>
          </div>
        </section>

        {/* Real-time chart */}
        <section className="bg-gray-800 p-4 rounded-lg mb-8" style={{height: '300px'}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="time" tick={{ fill: '#ccc', fontSize: 12 }} />
              <YAxis tick={{ fill: '#ccc', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#222', border: 'none' }} labelStyle={{ color: '#fff' }} />
              <Legend />
              <Line type="monotone" dataKey="incoming" stroke="#8884d8" dot={false} name="Incoming" />
              <Line type="monotone" dataKey="processed" stroke="#82ca9d" dot={false} name="Processed" />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Error Logs</h2>
          {/* Filter controls */}
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Search Applicant ID"
              className="p-2 rounded bg-gray-700 text-white flex-1"
              value={searchApplicant}
              onChange={e => setSearchApplicant(e.target.value)}
            />
            <select
              className="p-2 rounded bg-gray-700 text-white"
              value={errorType}
              onChange={e => setErrorType(e.target.value)}
            >
              <option value="">All Types</option>
              {errorTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              className="p-2 rounded bg-gray-700 text-white"
              value={timeframe}
              onChange={e => setTimeframe(Number(e.target.value))}
            >
              {TIMEFRAMES.map(tf => (
                <option key={tf.value} value={tf.value}>{tf.label}</option>
              ))}
            </select>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1">Time</th>
                  <th className="px-2 py-1">Applicant</th>
                  <th className="px-2 py-1">Type</th>
                  <th className="px-2 py-1">Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-500">No errors</td></tr>
                )}
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-700">
                    <td className="px-2 py-1">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="px-2 py-1">{log.applicantId || '-'}</td>
                    <td className="px-2 py-1">{log.errorType}</td>
                    <td className="px-2 py-1">{log.errorMessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
} 