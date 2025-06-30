// src/App.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, Clock, Briefcase, Zap, Percent, RefreshCw, AlertTriangle } from 'lucide-react';

// --- Type for input validation errors ---
type InputErrors = {
  licenseCost?: string;
  numUsers?: string;
  hoursSaved?: string;
  hourlyRate?: string;
  implementationCost?: string;
  timeToValue?: string;
};

// --- Reusable Input Component for a cleaner layout ---
interface InputFieldProps {
  label: string;
  icon: React.ElementType;
  value: number;
  setValue: (value: number) => void;
  isCurrency?: boolean;
  min?: number;
  errorMessage?: string;
  tooltipContent?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon: Icon, value, setValue, isCurrency = false, min, errorMessage, tooltipContent }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) {
      setValue(0); // Or handle as per preference, maybe keep old value or set to min
    } else {
      setValue(val);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      <div className="relative group">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {isCurrency ? (
            <DollarSign className="h-5 w-5 text-gray-500" />
          ) : (
            <Icon className="h-5 w-5 text-gray-500" />
          )}
        </div>
        <input
          type="number"
          min={min}
          step="any"
          value={value === 0 && typeof value === 'number' ? '' : String(value)} // Allow empty string for 0, but keep number type
          title={label}
          onChange={handleChange}
          className={`block w-full rounded-md border-gray-600 bg-gray-700/50 py-3 pl-10 pr-10 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errorMessage ? 'border-red-500 ring-red-500' : ''}`}
        />
        {tooltipContent && (
          <span
            data-tooltip-id="tooltip"
            data-tooltip-content={tooltipContent}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 cursor-help"
          >
            ⓘ
          </span>
        )}
      </div>
      {errorMessage && (
        <p className="mt-1 text-xs text-red-400 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-1" />
          {errorMessage}
        </p>
      )}
    </div>
  );
};


// --- Reusable Output Card Component ---
interface OutputCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

const OutputCard: React.FC<OutputCardProps> = ({ title, value, icon: Icon, color }) => (
  <div className="transform rounded-xl bg-gray-800 p-6 shadow-lg transition duration-300 hover:scale-105 hover:shadow-indigo-500/30">
    <div className={`mb-4 inline-block rounded-full p-3 ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <h3 className="text-4xl font-bold text-white">{value}</h3>
    <p className="text-sm font-medium text-gray-400">{title}</p>
  </div>
);


// --- Main App Component ---
export default function App() {
  // --- STATE MANAGEMENT for all inputs ---
  const [licenseCost, setLicenseCost] = useState(50);
  const [numUsers, setNumUsers] = useState(10);
  const [hoursSaved, setHoursSaved] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(75);
  const [implementationCost, setImplementationCost] = useState(5000);
  const [timeToValue, setTimeToValue] = useState(3); // in months
  const [pricingModel, setPricingModel] = useState<'monthly' | 'annual'>('monthly');
  const [errors, setErrors] = useState<InputErrors>({});

  // --- VALIDATION LOGIC ---
  const validateInputs = useCallback(() => {
    const newErrors: InputErrors = {};
    if (licenseCost < 0) newErrors.licenseCost = "Cannot be negative.";
    if (numUsers < 1) newErrors.numUsers = "Must be at least 1.";
    if (hoursSaved < 0) newErrors.hoursSaved = "Cannot be negative.";
    if (hourlyRate < 0) newErrors.hourlyRate = "Cannot be negative.";
    if (implementationCost < 0) newErrors.implementationCost = "Cannot be negative.";
    if (timeToValue < 0) newErrors.timeToValue = "Cannot be negative.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [licenseCost, numUsers, hoursSaved, hourlyRate, implementationCost, timeToValue]);

  // --- DERIVED CALCULATIONS using useMemo for efficiency ---
  const calculations = useMemo(() => {
    if (!validateInputs()) {
      // Return default/error values if inputs are invalid
      return {
        annualSavings: NaN,
        firstYearTotalCost: NaN,
        annualROI: NaN,
        paybackPeriodMonths: NaN,
        annualNetValue: NaN,
        annualLicenseCost: NaN,
        totalSavingsOver3Years: NaN,
        monthlyNetSavings: NaN, // Added for direct use
      };
    }

    const actualLicenseCost = pricingModel === 'annual' ? licenseCost : licenseCost * 12;
    const annualLicenseCost = actualLicenseCost * numUsers;

    const weeklySavingsPerUser = hoursSaved * hourlyRate;
    const totalWeeklySavings = weeklySavingsPerUser * numUsers;
    const annualSavings = totalWeeklySavings * 52;

    const firstYearTotalCost = annualLicenseCost + implementationCost;
    const annualNetValue = annualSavings - annualLicenseCost;

    // ROI calculation:
    let annualROI = 0;
    if (firstYearTotalCost > 0) {
      annualROI = (annualNetValue / firstYearTotalCost) * 100;
    } else if (annualNetValue > 0) {
      annualROI = Infinity; // Infinite ROI if costs are zero and savings are positive
    }

    const monthlyNetSavings = (annualSavings - annualLicenseCost) / 12;

    // Payback period calculation:
    let paybackPeriodMonths = Infinity; // Default to never
    if (monthlyNetSavings > 0) {
      // Payback period is TTV + time to recoup implementation cost from net savings
      paybackPeriodMonths = timeToValue + (implementationCost / monthlyNetSavings);
    }

    // Adjust annual savings for the first year based on Time-to-Value
    const firstYearEffectiveMonthsOfSavings = Math.max(0, 12 - timeToValue);
    const firstYearAdjustedSavings = annualSavings * (firstYearEffectiveMonthsOfSavings / 12);

    // Total savings over 3 years, considering TTV for the first year
    const totalSavingsOver3Years = firstYearAdjustedSavings + (annualSavings * 2);


    return {
      annualSavings, // This remains the full potential annual savings rate
      firstYearAdjustedSavings, // Savings specifically for Year 1 after TTV
      firstYearTotalCost,
      annualROI,
      paybackPeriodMonths,
      annualNetValue,
      annualLicenseCost,
      totalSavingsOver3Years,
      monthlyNetSavings, // expose for later use
    };
  }, [licenseCost, numUsers, hoursSaved, hourlyRate, implementationCost, timeToValue, pricingModel, validateInputs]);

  // --- DATA FOR THE CHART ---
  const chartData = useMemo(() => {
    if (isNaN(calculations.firstYearTotalCost)) { // Check if calculations are valid
      return [
        { name: 'Year 1', Cost: 0, Savings: 0, 'Net Value': 0 },
        { name: 'Year 2', Cost: 0, Savings: 0, 'Net Value': 0 },
        { name: 'Year 3', Cost: 0, Savings: 0, 'Net Value': 0 },
      ];
    }

    const year1NetValue = (calculations.firstYearAdjustedSavings ?? 0) - (calculations.firstYearTotalCost ?? 0);

    return [
      { name: 'Year 1', Cost: calculations.firstYearTotalCost, Savings: calculations.firstYearAdjustedSavings, 'Net Value': year1NetValue },
      { name: 'Year 2', Cost: calculations.annualLicenseCost, Savings: calculations.annualSavings, 'Net Value': calculations.annualNetValue }, // Year 2 uses full annual savings
      { name: 'Year 3', Cost: calculations.annualLicenseCost, Savings: calculations.annualSavings, 'Net Value': calculations.annualNetValue }, // Year 3 uses full annual savings
    ];
  }, [calculations]);

  // --- HELPER to format numbers as currency ---
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // --- Chart colors and keys for customization ---
  const costBarColor = "#4299E1";
  const savingsBarColor = "#48BB78";
  const netValueLineColor = "#C792EA";

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        
        {/* --- HEADER --- */}
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            SaaS ROI Calculator
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
            Quantify the business case for your next software investment by modeling key financial metrics.
          </p>
        </header>

        <main>
          {/* --- INPUTS & OUTPUTS GRID --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- INPUTS SECTION (LEFT) --- */}
            <div className="lg:col-span-1 bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-4">Input Metrics</h2>
              <div className="space-y-6">
                {/* Pricing Model Toggle */}
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-400">Pricing Model</label>
                  <div className="flex items-center">
                    <button
                      onClick={() => setPricingModel('monthly')}
                      className={`px-3 py-1 text-sm rounded-l-md ${pricingModel === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setPricingModel('annual')}
                      className={`px-3 py-1 text-sm rounded-r-md ${pricingModel === 'annual' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      Annual
                    </button>
                  </div>
                </div>

                <InputField
                  label={`License Cost per User/${pricingModel === 'monthly' ? 'Month' : 'Year'}`}
                  icon={DollarSign}
                  value={licenseCost}
                  setValue={setLicenseCost}
                  isCurrency
                  min={0}
                  errorMessage={errors.licenseCost}
                  tooltipContent={`Enter the license cost per user, billed ${pricingModel}.`}
                />
                <InputField
                  label="Number of Users"
                  icon={Users}
                  value={numUsers}
                  setValue={setNumUsers}
                  min={1}
                  errorMessage={errors.numUsers}
                  tooltipContent="Enter the total number of users for the software."
                />
                <InputField
                  label="Avg. Hours Saved per User/Week"
                  icon={Clock}
                  value={hoursSaved}
                  setValue={setHoursSaved}
                  min={0}
                  errorMessage={errors.hoursSaved}
                  tooltipContent="Estimate the average hours saved each week per user due to the new software."
                />
                <InputField
                  label="Avg. Employee Hourly Rate"
                  icon={Briefcase}
                  value={hourlyRate}
                  setValue={setHourlyRate}
                  isCurrency
                  min={0}
                  errorMessage={errors.hourlyRate}
                  tooltipContent="Enter the average fully-loaded hourly rate of the employees using the software."
                />
                <InputField
                  label="One-Time Implementation Cost"
                  icon={Zap}
                  value={implementationCost}
                  setValue={setImplementationCost}
                  isCurrency
                  min={0}
                  errorMessage={errors.implementationCost}
                  tooltipContent="Include all one-time costs: setup, training, migration, etc."
                />
                <InputField
                  label="Time-to-Value (Months)"
                  icon={RefreshCw}
                  value={timeToValue}
                  setValue={setTimeToValue}
                  min={0}
                  errorMessage={errors.timeToValue}
                  tooltipContent="How many months until the software is fully implemented and savings begin."
                />
              </div>
            </div>

            {/* --- OUTPUTS & CHART (RIGHT) --- */}
            <div className="lg:col-span-2 space-y-8">
              {/* --- OUTPUT CARDS --- */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <OutputCard
                  title="Annual Recurring Savings"
                  value={isNaN(calculations.annualSavings) ? "N/A" : formatCurrency(calculations.annualSavings)}
                  icon={DollarSign}
                  color="bg-green-500/80"
                />
                <OutputCard
                  title="Payback Period (Months)"
                  value={isNaN(calculations.paybackPeriodMonths) ? "N/A" : calculations.paybackPeriodMonths === Infinity ? "Never" : calculations.paybackPeriodMonths.toFixed(1)}
                  icon={RefreshCw}
                  color="bg-blue-500/80"
                />
                <OutputCard
                  title="First Year ROI"
                  value={isNaN(calculations.annualROI) ? "N/A" : calculations.annualROI === Infinity ? "Infinite %" : `${calculations.annualROI.toFixed(1)}%`}
                  icon={Percent}
                  color="bg-indigo-500/80"
                />
              </div>

              {/* --- CHART SECTION --- */}
              <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                <h2 className="text-2xl font-bold mb-6">3-Year Financial Projection</h2>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                      <XAxis dataKey="name" stroke="#A0AEC0" />
                      <YAxis 
                        stroke="#A0AEC0"
                        tickFormatter={(value: number) => {
                          if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
                          if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
                          return `$${value}`;
                        }} 
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                        contentStyle={{
                          backgroundColor: '#1A202C',
                          borderColor: '#4A5568',
                          borderRadius: '0.5rem'
                        }}
                        formatter={(value: number, name: string) => [`${formatCurrency(value)}`, name]}
                      />
                      <Legend wrapperStyle={{ color: '#A0AEC0' }} />
                      <Bar dataKey="Cost" fill={costBarColor} name="Total Cost" />
                      <Bar dataKey="Savings" fill={savingsBarColor} name="Total Savings" />
                      <Line type="monotone" dataKey="Net Value" stroke={netValueLineColor} strokeWidth={3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* --- ACTIONS --- */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8 border-t border-gray-700 mt-8">
                  <button
                    onClick={() => {
                      const data = {
                        "Input Metrics": {
                          "License Cost per User/Month": licenseCost,
                          "Number of Users": numUsers,
                          "Avg. Hours Saved per User/Week": hoursSaved,
                          "Avg. Employee Hourly Rate": hourlyRate,
                          "One-Time Implementation Cost": implementationCost,
                          "Time-to-Value (Months)": timeToValue
                        },
                        "Calculated Metrics": {
                          "Annual Recurring Savings": calculations.annualSavings,
                          "Annual License Cost": calculations.annualLicenseCost,
                          "First Year Total Cost": calculations.firstYearTotalCost,
                          "Net Value (Annual)": calculations.annualNetValue,
                          "First Year ROI (%)": calculations.annualROI,
                          "Payback Period (Months)": calculations.paybackPeriodMonths,
                          "Total Savings Over 3 Years": calculations.totalSavingsOver3Years
                        }
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'saas-roi-calculation.json';
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
                  >
                    Download Results
                  </button>

                  <button
                    onClick={() => {
                      import('jspdf').then(jsPDF => {
                        const doc = new jsPDF.default();
                        doc.setFontSize(16);
                        doc.text("SaaS ROI Calculator Results", 10, 20);
                        doc.setFontSize(12);
                        doc.text(`Annual Recurring Savings: ${formatCurrency(calculations.annualSavings)}`, 10, 40);
                        doc.text(`Annual License Cost: ${formatCurrency(calculations.annualLicenseCost)}`, 10, 50);
                        doc.text(`First Year Total Cost: ${formatCurrency(calculations.firstYearTotalCost)}`, 10, 60);
                        doc.text(`Net Value (Annual): ${formatCurrency(calculations.annualNetValue)}`, 10, 70);
                        doc.text(`First Year ROI: ${calculations.annualROI.toFixed(1)}%`, 10, 80);
                        doc.text(`Payback Period (Months): ${calculations.paybackPeriodMonths.toFixed(1)}`, 10, 90);
                        doc.text(`Total Savings Over 3 Years: ${formatCurrency(calculations.totalSavingsOver3Years)}`, 10, 100);
                        doc.save("saas-roi-report.pdf");
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
                  >
                    Export as PDF
                  </button>

                  <button
                    onClick={() => {
                      const csv = [
                        ['Metric', 'Value'],
                        ['License Cost per User/Month', licenseCost],
                        ['Number of Users', numUsers],
                        ['Avg. Hours Saved per User/Week', hoursSaved],
                        ['Avg. Employee Hourly Rate', hourlyRate],
                        ['One-Time Implementation Cost', implementationCost],
                        ['Time-to-Value (Months)', timeToValue],
                        ['Annual Recurring Savings', calculations.annualSavings],
                        ['Annual License Cost', calculations.annualLicenseCost],
                        ['First Year Total Cost', calculations.firstYearTotalCost],
                        ['Net Value (Annual)', calculations.annualNetValue],
                        ['First Year ROI (%)', calculations.annualROI],
                        ['Payback Period (Months)', calculations.paybackPeriodMonths],
                        ['Total Savings Over 3 Years', calculations.totalSavingsOver3Years]
                      ];
                      const content = csv.map(e => e.join(',')).join('\n');
                      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'saas-roi-results.csv';
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
                  >
                    Export as CSV
                  </button>

                  <div className="flex gap-2 flex-wrap text-sm text-gray-300">
                    <button
                      onClick={() => {
                        setLicenseCost(50);
                        setNumUsers(10);
                        setHoursSaved(5);
                        setHourlyRate(75);
                        setImplementationCost(5000);
                        setTimeToValue(3);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200"
                    >
                      Load Example Data
                    </button>
                    <button
                      onClick={() => {
                        setLicenseCost(0);
                        setNumUsers(0);
                        setHoursSaved(0);
                        setHourlyRate(0);
                        setImplementationCost(0);
                        setTimeToValue(0);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200"
                    >
                      Clear Inputs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Made with 💡 by Elias Kizito. All calculations are estimates—validate with finance before pitching.</p>
        </footer>
        <ReactTooltip id="tooltip" place="top" variant="dark" />
      </div>
    </div>
  );
}
