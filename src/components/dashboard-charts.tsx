"use client";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BankShare, DailyFlowPoint } from "@/services/dashboard";

const money = (value: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value);
const PIE_COLORS = ["#e1763b", "#c75151", "#547fc5", "#8a94a0", "#3f4d5b", "#a3b18a"];
const tooltipStyle = { fontSize: 11, borderRadius: 6, borderColor: "#e5e9ee" };

export function CashFlowChart({ data }: { data: DailyFlowPoint[] }) {
  const hasData = data.some((point) => point.income > 0 || point.expense > 0);
  if (!hasData) return <p className="grid h-44 place-items-center text-center text-xs text-[#84909d]">Son 7 günde onaylanmış hareket bulunamadı.</p>;
  return (
    <ResponsiveContainer height={190} width="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#edf0f3" vertical={false} />
        <XAxis axisLine={false} dataKey="date" tick={{ fontSize: 10, fill: "#9da7b1" }} tickLine={false} />
        <YAxis axisLine={false} tick={{ fontSize: 9, fill: "#a1aab4" }} tickFormatter={(value) => `₺${Math.round(Number(value) / 1000)}K`} tickLine={false} width={42} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => money(Number(value))} />
        <Area dataKey="income" fill="#208d6922" name="Para girişi" stroke="#208d69" strokeWidth={2} type="monotone" />
        <Area dataKey="expense" fill="#d4695b22" name="Para çıkışı" stroke="#d4695b" strokeWidth={2} type="monotone" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BankDistributionChart({ data }: { data: BankShare[] }) {
  if (!data.length) return <p className="grid h-32 place-items-center text-center text-xs text-[#84909d]">Bu ay için veri yok.</p>;
  return (
    <div className="flex items-center gap-7">
      <div className="h-32 w-32 shrink-0">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie data={data} dataKey="total" innerRadius={38} nameKey="bank" outerRadius={58} paddingAngle={2}>
              {data.map((entry, index) => <Cell fill={PIE_COLORS[index % PIE_COLORS.length]} key={entry.bank} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => money(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3 text-[11px] text-[#667383]">
        {data.map((entry, index) => <p key={entry.bank}><i className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />{entry.bank} <b className="ml-1">%{entry.percentage}</b></p>)}
      </div>
    </div>
  );
}
