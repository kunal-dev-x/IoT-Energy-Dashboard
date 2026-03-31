import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { FiCalendar, FiDownloadCloud, FiDollarSign, FiInfo, FiPlay, FiPause, FiRotateCcw, FiDownload } from 'react-icons/fi';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DataCard from '../components/DataCard';
import { 
  fetchMetrics, 
  saveBillingData, 
  getCurrentBilling,
  startSession,
  getCurrentSession,
  endSession,
  resetSession
} from '../services/api';

const axisStyle = { stroke: '#94a3b8', fontSize: 12 };
const gridColor = '#1f2937';
const COST_PER_UNIT = 8.5; // ₹ per kWh

// ===== DUMMY DATA FALLBACK =====
const DUMMY_BILLING_DATA = [
  { month: '2026-01', energy_kwh: 362.13, cost: 3078.13, avg_power: 500, max_power: 850 },
  { month: '2026-02', energy_kwh: 313.96, cost: 2668.67, avg_power: 460, max_power: 820 },
  { month: '2026-03', energy_kwh: 265.66, cost: 2258.11, avg_power: 420, max_power: 780 },
];

export default function Billing() {
  // ===== LIVE CURRENT MONTH STATE =====
  const [currentMonthBill, setCurrentMonthBill] = useState({
    energy: 0,
    cost: 0,
    rate: COST_PER_UNIT,
    status: 'Pending',
    lastUpdate: null,
  });

  // ===== HISTORICAL DATA STATE =====
  const [allMonthlyData, setAllMonthlyData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('api'); // 'api' or 'dummy'

  // ===== MONTH SELECTION STATE =====
  const [selectedMonth, setSelectedMonth] = useState(null); // null = current month
  const [selectedMonthData, setSelectedMonthData] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isLiveMode, setIsLiveMode] = useState(true);

  // ===== REAL-TIME POWER & INCREMENTAL BILLING STATE =====
  const [liveMetrics, setLiveMetrics] = useState({
    power: 0,      // Current power in watts
    voltage: 0,
    current: 0,
  });
  const [incrementalCost, setIncrementalCost] = useState(0); // Incremental cost added in current cycle
  const [costPerSecond, setCostPerSecond] = useState(0);    // Cost accumulation per second
  const [powerReadings, setPowerReadings] = useState([]);    // History of power readings
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());

  // ===== DATA TRANSFORMATION =====
  const transformBillingData = (data) => {
    return data.map(item => ({
      label: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value: parseFloat(item.cost) || 0,
      energy: parseFloat(item.energy_kwh) || 0,
      month: item.month,
      cost: parseFloat(item.cost) || 0,
    }));
  };

  // ===== FETCH HISTORICAL MONTHLY DATA (ONCE) =====
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch('http://localhost:5000/history/monthly?months=12');
        const data = await response.json();

        let finalData = [];

        if (data.data && data.data.length > 0) {
          // Merge API data with dummy data to ensure Jan, Feb, Mar are always included
          const apiMonths = new Set(data.data.map(m => m.month));
          const dummyToInclude = DUMMY_BILLING_DATA.filter(m => !apiMonths.has(m.month));
          finalData = [...data.data, ...dummyToInclude];
          setDataSource('api');
          console.log('✓ Fetched monthly data from API + fallback:', finalData.length, 'months');
        } else {
          finalData = DUMMY_BILLING_DATA;
          setDataSource('dummy');
          console.log('⚠ Using dummy monthly data (Jan, Feb, Mar 2026)');
        }

        // Sort by month in descending order (newest first)
        finalData.sort((a, b) => b.month.localeCompare(a.month));

        setAllMonthlyData(finalData);
        const transformedData = transformBillingData(finalData);
        setChartData(transformedData);

        // Build available months list
        const months = finalData.map(m => ({
          value: m.month,
          label: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          data: m
        }));
        setAvailableMonths(months);

        console.log('✓ Available months for selection:', months.map(m => m.label).join(', '));
        setLoading(false);
      } catch (error) {
        console.error('⚠️ Error fetching historical data:', error);
        setAllMonthlyData(DUMMY_BILLING_DATA);
        setDataSource('dummy');
        const transformedData = transformBillingData(DUMMY_BILLING_DATA);
        setChartData(transformedData);
        console.log('✓ Available months (fallback):', ['March 2026', 'February 2026', 'January 2026'].join(', '));
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, []);

  // ===== LIVE POLLING FOR CURRENT MONTH (every 1 second for granular tracking) =====
  useEffect(() => {
    if (!isLiveMode) return;

    const pollLiveMetrics = async () => {
      try {
        const data = await fetchMetrics();
        
        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
        const currentPower = parseFloat(data.power || 0);    // Power in watts
        const currentVoltage = parseFloat(data.voltage || 0);
        const currentCurrent = parseFloat(data.current || 0);

        // Calculate incremental cost per watt per second
        // Formula: (Power in Watts × Rate per kWh) / (1000 watts/kW × 3600 seconds/hour)
        const costPerSecond = (currentPower * COST_PER_UNIT) / (1000 * 3600);
        
        // Update live metrics for real-time display
        setLiveMetrics({
          power: currentPower,
          voltage: currentVoltage,
          current: currentCurrent,
        });

        // Track cost per second for display
        setCostPerSecond(costPerSecond);

        // Update power readings history (keep last 60 readings)
        setPowerReadings(prev => {
          const newReadings = [...prev, {
            power: currentPower,
            timestamp: now.getTime(),
            costIncrement: costPerSecond
          }];
          return newReadings.slice(-60);
        });

        // Calculate incremental cost for this polling cycle
        setIncrementalCost(prev => prev + costPerSecond);

        setCurrentMonthBill({
          energy: parseFloat(data.energy || 0),
          cost: parseFloat(data.cost || 0),
          rate: COST_PER_UNIT,
          status: 'Pending',
          lastUpdate: now.toLocaleTimeString(),
        });

        // ===== SAVE BILLING DATA TO DATABASE =====
        // Save every billing update to the database for historical tracking
        saveBillingData({
          voltage: currentVoltage,
          current: currentCurrent,
          power: currentPower,
          energy: parseFloat(data.energy || 0),
          cost: parseFloat(data.cost || 0),
        }).then(result => {
          if (result.success) {
            console.log('💾 Billing data saved to DB:', {
              power: currentPower + ' W',
              energy: data.energy + ' kWh',
              cost: data.cost + ' ₹',
            });
          }
        });

        console.log('✓ Live metrics:', {
          power: currentPower + ' W',
          costPerSecond: costPerSecond.toFixed(8) + ' ₹',
          cumulativeCost: parseFloat(data.cost || 0) + ' ₹',
        });
      } catch (error) {
        console.error('⚠️ Error fetching live metrics:', error.message);
        setCurrentMonthBill(prev => ({
          ...prev,
          status: 'Offline'
        }));
      }
    };

    // Fetch immediately
    pollLiveMetrics();

    // Poll every 1 second for granular billing updates
    const interval = setInterval(pollLiveMetrics, 1000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

  // ===== UPDATE SELECTED MONTH DATA =====
  useEffect(() => {
    if (selectedMonth === null) {
      // Current month selected
      setSelectedMonthData({
        month: 'Current Month (Today)',
        energy_kwh: currentMonthBill.energy,
        cost: currentMonthBill.cost,
        rate: currentMonthBill.rate,
        isLive: true,
      });
    } else {
      // Historical month selected
      const monthData = allMonthlyData.find(m => m.month === selectedMonth);
      if (monthData) {
        setSelectedMonthData({
          month: new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          energy_kwh: parseFloat(monthData.energy_kwh),
          cost: parseFloat(monthData.cost),
          rate: COST_PER_UNIT,
          isLive: false,
        });
      }
    }
  }, [selectedMonth, currentMonthBill, allMonthlyData]);

  // ===== PDF DOWNLOAD FUNCTION =====
  const downloadBillPdf = () => {
    if (!selectedMonthData) return;

    const doc = new jsPDF();
    const margin = 14;
    const line = (text, y, size = 12, weight = 'normal') => {
      doc.setFontSize(size);
      doc.setFont(undefined, weight);
      doc.text(text, margin, y);
    };

    const dateStr = new Date().toLocaleString();
    
    // Header
    line('ENERGY BILL', 18, 18, 'bold');
    line('═'.repeat(40), 22);
    
    // Bill Info
    line(`Month: ${selectedMonthData.month}`, 32);
    line(`Generated: ${dateStr}`, 40);
    line(`Status: ${currentMonthBill.status}`, 48);
    
    // Summary Section
    line('BILL SUMMARY', 60, 14, 'bold');
    line('─'.repeat(40), 64);
    line(`Energy Consumed:  ${selectedMonthData.energy_kwh.toFixed(2)} kWh`, 72);
    line(`Rate:             ₹ ${selectedMonthData.rate.toFixed(2)} / kWh`, 80);
    line(`Total Bill:       ₹ ${selectedMonthData.cost.toFixed(2)}`, 88, 13, 'bold');
    
    // Breakdown
    line('CALCULATION', 104, 12, 'bold');
    line('─'.repeat(40), 108);
    line(`${selectedMonthData.energy_kwh.toFixed(2)} kWh × ₹${selectedMonthData.rate.toFixed(2)}/kWh = ₹${selectedMonthData.cost.toFixed(2)}`, 116);
    
    // Footer
    line('Thank you for using Energy Dashboard', 160, 11, 'italic');
    line('✓ Billing System v1.0', 168, 9);

    const fileName = selectedMonth 
      ? `energy-bill-${selectedMonth}.pdf`
      : `energy-bill-current.pdf`;
    
    doc.save(fileName);
    console.log('✓ PDF downloaded:', fileName);
  };

  // ===== UI CARDS =====
  const displayBill = selectedMonthData || currentMonthBill;
  
  const cards = [
    { 
      title: 'Units Consumed', 
      value: displayBill.energy_kwh || displayBill.energy, 
      unit: 'kWh', 
      icon: FiCalendar, 
      accent: 'linear-gradient(120deg, rgba(34,211,238,0.35), rgba(99,102,241,0.3))' 
    },
    { 
      title: 'Cost per Unit', 
      value: displayBill.rate, 
      unit: '₹/kWh', 
      icon: FiDollarSign, 
      accent: 'linear-gradient(120deg, rgba(16,185,129,0.35), rgba(34,211,238,0.3))' 
    },
    { 
      title: 'Total Bill', 
      value: displayBill.cost, 
      unit: '₹', 
      icon: FiDollarSign, 
      accent: 'linear-gradient(120deg, rgba(251,191,36,0.35), rgba(34,197,94,0.3))' 
    },
    { 
      title: selectedMonth === null ? 'Current Status' : 'Month', 
      value: selectedMonth === null ? (isLiveMode ? '🔴 LIVE' : '⏸ Paused') : selectedMonthData?.month?.split(' ')[0], 
      unit: '', 
      icon: FiCalendar, 
      accent: 'linear-gradient(120deg, rgba(168,85,247,0.4), rgba(34,211,238,0.3))' 
    },
  ];

  return (
    <div className="space-y-8">
      {/* ===== KEY METRICS CARDS ===== */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <DataCard key={card.title} {...card} />
        ))}
      </section>

      {/* ===== REAL-TIME INCREMENTAL BILLING ===== */}
      {selectedMonth === null && (
        <section className="glass rounded-2xl p-6 shadow-glow border-l-4 border-l-red-500">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Real-time Power Consumption */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Real-time Power</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-lime-400 tabular-nums">
                  {liveMetrics.power.toFixed(2)}
                </span>
                <span className="text-sm text-slate-400">Watts</span>
              </div>
              <p className="text-xs text-slate-500">
                Voltage: {liveMetrics.voltage.toFixed(2)}V | Current: {liveMetrics.current.toFixed(3)}A
              </p>
            </div>

            {/* Cost Per Second (Very Precise) */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cost/Second</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-amber-400 tabular-nums animate-pulse">
                  ₹ {costPerSecond.toFixed(8)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                @ ₹{COST_PER_UNIT}/kWh
              </p>
            </div>

            {/* Cost Per Unit (Watt) */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cost/Watt</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-cyan-400 tabular-nums">
                  ₹ {(COST_PER_UNIT / 1000).toFixed(9)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Incremental per watt
              </p>
            </div>

            {/* Incremental Cost Accumulation */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Session Cost</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-400 tabular-nums animate-pulse">
                  ₹ {incrementalCost.toFixed(6)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Since page load
              </p>
            </div>
          </div>

          {/* Live Calculation Breakdown */}
          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            <p className="text-sm font-semibold text-white">📊 Real-time Calculation Breakdown:</p>
            <div className="grid gap-3 text-xs bg-white/5 p-4 rounded-lg font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Current Power:</span>
                <span className="text-right text-lime-400">{liveMetrics.power.toFixed(4)} watts</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Rate per kWh:</span>
                <span className="text-right text-yellow-400">₹ {COST_PER_UNIT.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Formula:</span>
                <span className="text-right text-sky-300">(Power × Rate) ÷ (1000 × 3600)</span>
              </div>
              <div className="border-t border-white/10 py-2"></div>
              <div className="flex justify-between text-slate-200 font-semibold">
                <span>Cost Per Second:</span>
                <span className="text-right text-amber-300">₹ {costPerSecond.toFixed(8)}</span>
              </div>
              <div className="flex justify-between text-slate-200 font-semibold">
                <span>Session Total:</span>
                <span className="text-right text-orange-300">₹ {incrementalCost.toFixed(6)}</span>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="mt-4 flex gap-2 items-start text-xs text-slate-300 bg-blue-500/10 p-3 rounded border border-blue-500/20">
            <FiInfo size={16} className="flex-shrink-0 mt-0.5 text-blue-400" />
            <span>
              The bill increases in real-time based on your current power consumption. Every watt consumed adds to your bill. Even decimal point changes are tracked precisely for accurate billing.
            </span>
          </div>
        </section>
      )}

      {/* ===== MONTH SELECTOR & CONTROLS ===== */}
      <section className="glass rounded-2xl p-5 shadow-glow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">View Bill For</p>
            <h3 className="text-xl font-semibold text-white">
              {selectedMonth === null ? 'Current Month (Today)' : selectedMonthData?.month}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {selectedMonthData?.isLive ? '🔴 LIVE - Updates every 1 second' : '📊 Historical data'}
            </p>
          </div>

          {/* Month Selection Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-300">Select Month:</label>
            <select
              value={selectedMonth === null ? 'current' : selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'current' ? null : e.target.value)}
              className="rounded-lg bg-white/10 border border-white/20 text-white px-4 py-2 text-sm focus:outline-none focus:border-cyan-400/50 transition"
            >
              <option value="current">📅 Current Month (Today)</option>
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            {/* Status Badge */}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                selectedMonthData?.isLive
                  ? 'bg-red-500/20 text-red-200 animate-pulse'
                  : 'bg-blue-500/20 text-blue-200'
              }`}
            >
              {selectedMonthData?.isLive ? '🔴 LIVE' : '✓ Archived'}
            </span>

            {/* Download Button */}
            <button
              onClick={downloadBillPdf}
              disabled={!selectedMonthData || loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <FiDownloadCloud size={16} /> PDF
            </button>
          </div>
        </div>
      </section>

      {/* ===== MONTHLY BILLS CHART ===== */}
      <section className="glass rounded-2xl p-5 shadow-glow">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Overview</p>
          <h3 className="text-lg font-semibold text-white">Energy Bills Trend</h3>
          <p className="text-xs text-slate-400 mt-1">
            {dataSource === 'api' ? '✓ Data from backend' : '⚠ Demo data (API unavailable)'}
          </p>
        </div>

        {/* Chart */}
        <div className="h-80">
          {chartData.length > 0 ? (
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
                <YAxis tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} label={{ value: 'Bill (₹)', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.25)', borderRadius: 12 }} formatter={(value) => `₹${value.toFixed(2)}`} />
                <Bar dataKey="value" radius={[10, 10, 4, 4]} fill="url(#billGradient)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              {loading ? '⏳ Loading billing data...' : 'No billing data available'}
            </div>
          )}
        </div>
      </section>

      {/* ===== SELECTED MONTH BREAKDOWN ===== */}
      <section className="glass rounded-2xl p-5 shadow-glow">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Selected Period</p>
          <h3 className="text-lg font-semibold text-white">Billing Breakdown</h3>
        </div>

        {selectedMonthData ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left py-3 px-4 text-slate-300">Metric</th>
                  <th className="text-right py-3 px-4 text-slate-300">Value</th>
                  <th className="text-right py-3 px-4 text-slate-300">Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-slate-200">Energy Consumption</td>
                  <td className="py-3 px-4 text-right text-slate-300">{selectedMonthData.energy_kwh.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-slate-400">kWh</td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-slate-200">Rate (Fixed)</td>
                  <td className="py-3 px-4 text-right text-slate-300">₹ {selectedMonthData.rate.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-slate-400">₹/kWh</td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5 bg-white/5">
                  <td className="py-3 px-4 text-slate-100 font-semibold">Total Bill</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold text-lg">₹ {selectedMonthData.cost.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-slate-400">₹</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            {loading ? '⏳ Loading data...' : 'No data available for selected month'}
          </div>
        )}
      </section>

      {/* ===== ALL MONTHS REFERENCE TABLE ===== */}
      <section className="glass rounded-2xl p-5 shadow-glow">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Reference</p>
          <h3 className="text-lg font-semibold text-white">All Months Summary</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr>
                <th className="text-left py-3 px-4 text-slate-300">Month</th>
                <th className="text-right py-3 px-4 text-slate-300">Energy (kWh)</th>
                <th className="text-right py-3 px-4 text-slate-300">Rate</th>
                <th className="text-right py-3 px-4 text-slate-300">Total Bill (₹)</th>
                <th className="text-center py-3 px-4 text-slate-300">Status</th>
                <th className="text-center py-3 px-4 text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* ===== CURRENT MONTH ROW (LIVE DATA) ===== */}
              <tr 
                className={`border-b border-white/5 hover:bg-white/10 cursor-pointer transition ${
                  selectedMonth === null ? 'bg-white/10 border-l-2 border-l-red-400' : ''
                }`}
                onClick={() => setSelectedMonth(null)}
              >
                <td className="py-3 px-4 text-slate-200 font-semibold">
                  <span className="flex items-center gap-2">
                    📅 Current Month (Today)
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-slate-300">{currentMonthBill.energy.toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-slate-300">₹ {currentMonthBill.rate.toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-orange-400 font-semibold">₹ {currentMonthBill.cost.toFixed(2)}</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-200 text-xs font-semibold animate-pulse">
                    🔴 LIVE
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMonth(null);
                    }}
                    className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                  >
                    View
                  </button>
                </td>
              </tr>

              {/* ===== HISTORICAL MONTHS ===== */}
              {chartData.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`border-b border-white/5 hover:bg-white/10 cursor-pointer transition ${
                    selectedMonth === row.month ? 'bg-white/10 border-l-2 border-l-cyan-400' : ''
                  }`}
                  onClick={() => setSelectedMonth(row.month === 'current' ? null : row.month)}
                >
                  <td className="py-3 px-4 text-slate-200">{row.label}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{row.energy.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-slate-300">₹ {COST_PER_UNIT.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-semibold">₹ {row.value.toFixed(2)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold">
                      ✓ Archived
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMonth(row.month === 'current' ? null : row.month);
                      }}
                      className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}