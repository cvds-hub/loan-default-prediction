'use client';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const defaultForm = {
  AMT_INCOME_TOTAL: 135000,
  AMT_CREDIT: 312682,
  AMT_ANNUITY: 14688,
  DAYS_BIRTH: -19241,
  DAYS_EMPLOYED: -3005,
  EXT_SOURCE_1: 0.31,
  EXT_SOURCE_2: 0.44,
  EXT_SOURCE_3: 0.29,
  NAME_CONTRACT_TYPE: 'Cash loans',
  CODE_GENDER: 'M',
  NAME_INCOME_TYPE: 'Working',
  NAME_EDUCATION_TYPE: 'Secondary / secondary special',
  NAME_FAMILY_STATUS: 'Single / not married',
  NAME_HOUSING_TYPE: 'House / apartment',
  CNT_CHILDREN: 0,
  CNT_FAM_MEMBERS: 1,
  OWN_CAR_AGE: '',
  OCCUPATION_TYPE: '',
};

const riskColors = {
  'LOW RISK': '#16a34a',
  'MEDIUM RISK': '#d97706',
  'HIGH RISK': '#dc2626',
};

const recommendationColors = {
  'APPROVE': 'bg-green-100 text-green-800 border-green-300',
  'REVIEW': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'DECLINE': 'bg-red-100 text-red-800 border-red-300',
};

export default function Home() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

 const handleChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || value === 'null') {
      setForm(prev => ({ ...prev, [name]: null }));
    } else if (!isNaN(value) && value !== '') {
      setForm(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
  ...form,
  OWN_CAR_AGE: form.OWN_CAR_AGE === '' ? null : form.OWN_CAR_AGE,
  OCCUPATION_TYPE: form.OCCUPATION_TYPE === '' ? null : form.OCCUPATION_TYPE,
  EXT_SOURCE_1: form.EXT_SOURCE_1 === '' ? null : form.EXT_SOURCE_1,
  EXT_SOURCE_2: form.EXT_SOURCE_2 === '' ? null : form.EXT_SOURCE_2,
  EXT_SOURCE_3: form.EXT_SOURCE_3 === '' ? null : form.EXT_SOURCE_3,
}),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = result ? [
    { name: 'Default Risk', value: Math.round(result.probability * 100) },
    { name: 'Safe', value: Math.round((1 - result.probability) * 100) },
  ] : [];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-900 text-white py-6 px-8 shadow">
        <h1 className="text-2xl font-bold">Loan Default Risk Assessment</h1>
        <p className="text-slate-300 text-sm mt-1">AI-powered credit risk prediction and assessment</p>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Input Form */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Applicant Information</h2>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Annual Income', name: 'AMT_INCOME_TOTAL', type: 'number' },
              { label: 'Credit Amount', name: 'AMT_CREDIT', type: 'number' },
              { label: 'Annuity Amount', name: 'AMT_ANNUITY', type: 'number' },
              { label: 'Days Since Birth (negative)', name: 'DAYS_BIRTH', type: 'number' },
              { label: 'Days Employed (negative)', name: 'DAYS_EMPLOYED', type: 'number' },
              { label: 'Ext Source 1 (0-1)', name: 'EXT_SOURCE_1', type: 'number' },
              { label: 'Ext Source 2 (0-1)', name: 'EXT_SOURCE_2', type: 'number' },
              { label: 'Ext Source 3 (0-1)', name: 'EXT_SOURCE_3', type: 'number' },
              { label: 'Children Count', name: 'CNT_CHILDREN', type: 'number' },
              { label: 'Family Members', name: 'CNT_FAM_MEMBERS', type: 'number' },
              { label: 'Car Age (blank if none)', name: 'OWN_CAR_AGE', type: 'number' },
            ].map(({ label, name, type }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={form[name] ?? ''}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              { label: 'Contract Type', name: 'NAME_CONTRACT_TYPE', options: ['Cash loans', 'Revolving loans'] },
              { label: 'Gender', name: 'CODE_GENDER', options: ['M', 'F'] },
              { label: 'Income Type', name: 'NAME_INCOME_TYPE', options: ['Working', 'Commercial associate', 'Pensioner', 'State servant', 'Student'] },
              { label: 'Education', name: 'NAME_EDUCATION_TYPE', options: ['Secondary / secondary special', 'Higher education', 'Incomplete higher', 'Lower secondary', 'Academic degree'] },
              { label: 'Family Status', name: 'NAME_FAMILY_STATUS', options: ['Single / not married', 'Married', 'Civil marriage', 'Widow', 'Separated'] },
              { label: 'Housing Type', name: 'NAME_HOUSING_TYPE', options: ['House / apartment', 'With parents', 'Municipal apartment', 'Rented apartment', 'Office apartment'] },
            ].map(({ label, name, options }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <select
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-700 transition disabled:opacity-50"
          >
            {loading ? 'Assessing...' : 'Run Credit Assessment'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {!result && !loading && (
            <div className="bg-white rounded-xl shadow p-6 flex items-center justify-center h-48 text-slate-600">
              Submit an application to see the risk assessment
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-xl shadow p-6 flex items-center justify-center h-48">
              <div className="text-slate-500 animate-pulse">Running assessment...</div>
            </div>
          )}

          {result && (
            <>
              {/* Risk Score */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Risk Assessment</h2>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-4xl font-bold" style={{ color: riskColors[result.risk_tier] }}>
                      {Math.round(result.probability * 100)}%
                    </p>
                    <p className="text-slate-500 text-sm">Default Probability</p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg border font-semibold text-sm ${recommendationColors[result.recommendation]}`}>
                    {result.recommendation}
                  </div>
                </div>

                {/* Risk bar */}
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${result.probability * 100}%`,
                      backgroundColor: riskColors[result.risk_tier]
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Low Risk</span>
                  <span>High Risk</span>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Risk Breakdown</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip formatter={v => `${v}%`} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      <Cell fill={riskColors[result.risk_tier]} />
                      <Cell fill="#94a3b8" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Key Factors */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Key Factors</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase mb-2">Risk Factors</p>
                    {result.top_risk_factors.map((f, i) => (
                      <div key={i} className="text-sm text-slate-700 py-1 border-b border-slate-100">
                        {f.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-600 uppercase mb-2">Mitigating Factors</p>
                    {result.top_mitigating_factors.map((f, i) => (
                      <div key={i} className="text-sm text-slate-700 py-1 border-b border-slate-100">
                        {f.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-3">AI Credit Assessment</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {result.summary}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}