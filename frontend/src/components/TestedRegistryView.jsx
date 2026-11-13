import React, { useState } from 'react';

export default function TestedRegistryView({ 
  registry, 
  onSelectStudent, 
  onDeleteRecord, 
  onClearRegistry,
  onOpenPrintSlip 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = registry.filter(item => {
    const matchesSearch = 
      (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
      (item.uid && item.uid.toLowerCase().includes(search.toLowerCase())) ||
      (item.branch && item.branch.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'PLACED') return item.isPlaced;
    if (statusFilter === 'NOT_PLACED') return !item.isPlaced;
    return true;
  });

  const total = registry.length;
  const placedCount = registry.filter(r => r.isPlaced).length;
  const placementRate = total > 0 ? ((placedCount / total) * 100).toFixed(1) : '0.0';
  const avgProbability = total > 0 
    ? (registry.reduce((acc, r) => acc + (r.probability || 0), 0) / total * 100).toFixed(1) 
    : '0.0';

  const handleExportCsv = () => {
    if (registry.length === 0) return;
    const header = "UID,Name,Branch,College Tier,CGPA,Backlogs,Aptitude,Coding,DSA,Communication,Placement Likelihood,Verdict,Timestamp\n";
    const rows = registry.map(r => {
      const p = r.profile || {};
      return `"${r.uid}","${r.name}","${p.branch || ''}","${p.college_tier || ''}",${p.cgpa || ''},${p.backlogs || 0},${p.aptitude_score || ''},${p.coding_skills || ''},${p.dsa_score || ''},${p.communication_skills || ''},${(r.probability * 100).toFixed(1)}%,"${r.isPlaced ? 'PLACED' : 'NOT PLACED'}","${r.timestamp}"`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Placement_Drive_Session_Registry_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Tested</span>
          <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">{total}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Session candidates</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">Eligible / Placed</span>
          <div className="text-3xl font-black text-emerald-700 mt-1 tabular-nums">{placedCount}</div>
          <span className="text-xs text-emerald-700 mt-0.5 block">Cleared 50% cutoff</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#011f3b] block">Pass Percentage</span>
          <div className="text-3xl font-black text-[#011f3b] mt-1 tabular-nums">{placementRate}%</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Cohort clearance rate</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">Mean Placement %</span>
          <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">{avgProbability}%</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Average candidate likelihood</span>
        </div>
      </div>

      {/* Registry Table Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col gap-5">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#011f3b] text-[22px]">history_edu</span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Tested Candidates Session Registry</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              History of student evaluations conducted during the active session
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {total > 0 && (
              <>
                <button
                  onClick={handleExportCsv}
                  className="px-3.5 py-2 rounded-xl bg-[#011f3b] hover:bg-[#002b5c] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Export Report (CSV)</span>
                </button>

                <button
                  onClick={onClearRegistry}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:text-[#b91c1c] hover:bg-rose-50 transition"
                >
                  Clear Session
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80 relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by UID, Name, or Branch..."
              className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#011f3b] outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'ALL' ? 'bg-white text-[#011f3b] shadow-xs font-bold' : 'hover:text-slate-900'}`}
            >
              All ({total})
            </button>
            <button
              onClick={() => setStatusFilter('PLACED')}
              className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'PLACED' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'hover:text-slate-900'}`}
            >
              Placed ({placedCount})
            </button>
            <button
              onClick={() => setStatusFilter('NOT_PLACED')}
              className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'NOT_PLACED' ? 'bg-white text-rose-800 shadow-xs font-bold' : 'hover:text-slate-900'}`}
            >
              At Risk ({total - placedCount})
            </button>
          </div>
        </div>

        {/* Empty State or Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-slate-400 text-4xl mb-2">person_off</span>
            <p className="text-xs font-semibold text-slate-600">No tested student records found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {total === 0 ? "Test a student in 'Student Live Evaluation' and click 'Save to Registry'." : "No records match your search filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">UID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">CGPA</th>
                  <th className="py-3 px-4">Coding/DSA</th>
                  <th className="py-3 px-4">Aptitude & Comm</th>
                  <th className="py-3 px-4">Placement %</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, index) => {
                  const pct = (item.probability * 100).toFixed(1);
                  const p = item.profile || {};

                  return (
                    <tr key={item.id || index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.uid || 'N/A'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.name || 'Candidate'}</td>
                      <td className="py-3 px-4">{p.branch || 'CSE'}</td>
                      <td className="py-3 px-4 font-semibold tabular-nums">{p.cgpa ? Number(p.cgpa).toFixed(2) : '--'}</td>
                      <td className="py-3 px-4 tabular-nums">{p.coding_skills || '--'} / {p.dsa_score || '--'}</td>
                      <td className="py-3 px-4 tabular-nums">{p.aptitude_score || '--'}% • {p.communication_skills || '--'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${item.isPlaced ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-slate-900 tabular-nums">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.isPlaced 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {item.isPlaced ? 'PLACED' : 'NOT PLACED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectStudent(item)}
                            title="Load Profile into Testing Form"
                            className="p-1.5 text-[#011f3b] hover:bg-[#011f3b]/10 rounded-lg transition"
                          >
                            <span className="material-symbols-outlined text-[17px]">edit_note</span>
                          </button>

                          <button
                            onClick={() => onOpenPrintSlip(item)}
                            title="Print Evaluation Slip"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <span className="material-symbols-outlined text-[17px]">print</span>
                          </button>

                          <button
                            onClick={() => onDeleteRecord(item.id)}
                            title="Remove from Registry"
                            className="p-1.5 text-slate-400 hover:text-[#b91c1c] hover:bg-rose-50 rounded-lg transition"
                          >
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
