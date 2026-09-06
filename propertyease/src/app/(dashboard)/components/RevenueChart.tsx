'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';
import type { Payment } from '@/lib/database';

interface RevenueChartProps {
  lang?: 'en' | 'ar';
  paymentData?: Payment[];
  currency?: string;
  currencySymbol?: string;
  hasData?: boolean;
}

export default function RevenueChart({ lang = 'en', paymentData, currency = 'QAR', currencySymbol = 'QAR', hasData = false }: RevenueChartProps) {
  const [chartRef, setChartRef] = useState<HTMLDivElement | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    if (chartRef) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) { setIsChartReady(true); observer.disconnect(); }
        },
        { threshold: 0.1 }
      );
      observer.observe(chartRef);
      return () => observer.disconnect();
    }
  }, [chartRef]);

  // Build chart data from real payment records if provided
  let chartData: { month: string; amount: number }[] = [];
  let totalRevenue = 0;

  if (paymentData && paymentData.length > 0) {
    const monthMap: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    paymentData
      .filter(p => p.status === 'received')
      .forEach(p => {
        if (!p.payment_date) return;
        const d = new Date(p.payment_date);
        const key = months[d.getMonth()];
        monthMap[key] = (monthMap[key] || 0) + p.amount;
      });
    chartData = months.map(m => ({ month: m, amount: Math.round((monthMap[m] || 0) / 1000000 * 100) / 100 }))
      .filter(d => d.amount > 0);
    totalRevenue = Object.values(monthMap).reduce((a, b) => a + b, 0) / 1000000;
  }

  const maxVal = Math.max(...chartData.map(d => d.amount), 1);
  const displayTotal = totalRevenue > 0 ? totalRevenue.toFixed(2) : '0';

  const heading = lang === 'ar' ? 'اتجاه الإيرادات' : 'Revenue trend';
  const subtext = lang === 'ar' ? 'الإيجارات المحصلة · آخر 6 أشهر' : 'Collected rent &middot; last 6 months';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-extrabold text-[#0D2A24] text-base tracking-tight">{heading}</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">{subtext}</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-[#132B25]/20" dir="ltr">
            <option>2025</option>
            <option>2024</option>
          </select>
        </div>
      </div>

      {/* Big Value Row — only show when there's real data */}
      {hasData ? (
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-xl font-extrabold text-slate-400">{currencySymbol}</span>
          <span className="text-4xl font-extrabold text-[#0D2A24] tracking-tight">{displayTotal}M</span>
          <span className="inline-flex items-center gap-0.5 text-sm font-bold text-emerald-600 me-auto">
            <TrendingUp className="w-4 h-4" />
            8.4%
          </span>
        </div>
      ) : (
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-xl font-extrabold text-slate-400">{currencySymbol}</span>
          <span className="text-4xl font-extrabold text-slate-300 tracking-tight">—</span>
        </div>
      )}

      {/* Chart */}
      <div ref={setChartRef} className="h-56 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData.length > 0 ? chartData : [{ month: 'Jan', amount: 0 }, { month: 'Feb', amount: 0 }, { month: 'Mar', amount: 0 }, { month: 'Apr', amount: 0 }, { month: 'May', amount: 0 }, { month: 'Jun', amount: 0 }]}
            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="strokeRevenue" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#16A34A" />
                <stop offset="100%" stopColor="#22C55E" />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              stroke="none"
              axisLine={false}
              tickLine={false}
              tickSize={0}
              dy={14}
              tick={({ x, y, payload }) => (
                <text x={x} y={y} textAnchor="middle" fontSize="12" fill="#94A3B8" fontWeight="500">
                  {payload.value}
                </text>
              )}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickSize={0}
              dx={-8}
              tick={({ x, y, value }: any) => {
                // Guard against undefined / NaN values when chartData is empty.
                // Previously `tick={undefined}` let recharts' default formatter
                // run on undefined, producing NaN labels.
                const num = Number(value);
                if (!Number.isFinite(num)) {
                  return <text x={x} y={y} textAnchor="end" fontSize="11" fill="#94A3B8" fontWeight="500">0</text>;
                }
                return (
                  <text x={x} y={y} textAnchor="end" fontSize="11" fill="#94A3B8" fontWeight="500">
                    {(num / 1000000).toFixed(1)}
                  </text>
                );
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length && hasData) {
                  return (
                    <div className="px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-slate-900 text-sm">
                          {currencySymbol} {((payload[0]?.value ?? 0) as number).toFixed(2)}M
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{payload[0]?.name ?? ''} 2025</div>
                    </div>
                  );
                }
                return null;
              }}
              wrapperStyle={{ pointerEvents: 'none' }}
              labelStyle={{ pointerEvents: 'none' }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="url(#strokeRevenue)"
              strokeWidth={3}
              fill="url(#colorRevenue)"
              dot={false}
              activeDot={{
                r: 5,
                stroke: '#fff',
                strokeWidth: 2,
                fill: '#22C55E',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
