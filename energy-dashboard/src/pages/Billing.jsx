import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { FiCalendar, FiDownloadCloud, FiDollarSign } from 'react-icons/fi';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DataCard from '../components/DataCard';

const axisStyle = { stroke: '#94a3b8', fontSize: 12 };
const gridColor = '#1f2937';

export default function Billing() {
  const [bill, setBill] = useState({ units: 0, rate: 0, total: 0, cycle: '', status: 'Pending' });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch billing data from API endpoint
    setLoading(false);
  }, []);

  const downloadBillPdf = () => {
    const doc = new jsPDF();
    const margin = 14;
    const line = (text, y, size = 12, weight = 'normal') => {
      doc.setFontSize(size);
      doc.setFont(undefined, weight);
      doc.text(text, margin, y);
    };

    const dateStr = new Date().toLocaleString();
    line('Energy Bill', 18, 18, 'bold');
    line(`Cycle: ${bill.cycle}`, 28);
    line(`Status: ${bill.status}`, 36);
    line(`Generated: ${dateStr}`, 44);

    line('Summary', 60, 14, 'bold');
    line(`Units Consumed: ${bill.units.toFixed(1)} kWh`, 70);
    line(`Cost per Unit: ₹ ${bill.rate.toFixed(2)}`, 78);
    line(`Total: ₹ ${bill.total.toFixed(2)}`, 86, 13, 'bold');

    line('Recent Bills (₹)', 104, 13, 'bold');
    const startY = 112;
    chartData.slice(0, 6).forEach((bar, idx) => {
      const y = startY + idx * 8;
      line(`${bar.label}: ${bar.value}`, y);
    });

    line('Thank you for choosing Energy Dashboard', 160, 11);
    doc.save('energy-bill.pdf');
  };

  const cards = [
    { title: 'Units Consumed', value: bill.units, unit: 'kWh', icon: FiCalendar, accent: 'linear-gradient(120deg, rgba(34,211,238,0.35), rgba(99,102,241,0.3))' },
    { title: 'Cost per Unit', value: bill.rate, unit: '₹', icon: FiDollarSign, accent: 'linear-gradient(120deg, rgba(16,185,129,0.35), rgba(34,211,238,0.3))' },
    { title: 'Total Bill', value: bill.total, unit: '₹', icon: FiDollarSign, accent: 'linear-gradient(120deg, rgba(251,191,36,0.35), rgba(34,197,94,0.3))' },
    { title: 'Billing Cycle', value: bill.cycle, unit: '', icon: FiCalendar, accent: 'linear-gradient(120deg, rgba(168,85,247,0.4), rgba(34,211,238,0.3))' },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <DataCard key={card.title} {...card} />
        ))}
      </section>

      <section className="glass rounded-2xl p-5 shadow-glow">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Billing</p>
            <h3 className="text-xl font-semibold text-white">Monthly Bill</h3>
            <p className="text-sm text-slate-400">Cycle: {bill.cycle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                bill.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-100'
              }`}
            >
              {bill.status}
            </span>
            <button
              onClick={downloadBillPdf}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:border-white/20"
            >
              <FiDownloadCloud size={16} /> Download Bill
            </button>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="billGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
              <YAxis tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.25)', borderRadius: 12 }} />
              <Bar dataKey="value" radius={[10, 10, 4, 4]} fill="url(#billGradient)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}