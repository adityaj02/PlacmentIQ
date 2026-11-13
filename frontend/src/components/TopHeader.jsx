import React from 'react';

export default function TopHeader({ 
  activeTab, 
  setActiveTab, 
  backendOnline, 
  testedCount = 0,
  onReset 
}) {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Institutional Header Bar */}
        <div className="flex items-center justify-between py-3.5 border-b border-slate-100">
          
          {/* Logo & University Identity */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center p-1 bg-white border border-slate-200/80 rounded-xl shadow-xs">
              <img 
                src="/cu_logo.png" 
                alt="Chandigarh University" 
                className="h-9 sm:h-10 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-9 h-9 rounded-lg bg-[#011f3b] text-white items-center justify-center font-black text-sm">
                CU
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#011f3b] bg-slate-100 px-2 py-0.5 rounded">
                  Chandigarh University
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-semibold text-[#b91c1c] tracking-tight">
                  Corporate Resource Center
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight tracking-tight mt-0.5">
                PlacementIQ — Student Placement Readiness Engine
              </h1>
            </div>
          </div>

          {/* Right Status Indicators */}
          <div className="flex items-center gap-2.5">
            {/* System Status Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border bg-slate-50 text-slate-700 border-slate-200">
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="hidden sm:inline">{backendOnline ? 'Institutional Model Active' : 'Connecting Model...'}</span>
              <span className="sm:hidden">{backendOnline ? 'Active' : 'Offline'}</span>
            </div>

            {/* Evaluated Student Count */}
            <button
              onClick={() => setActiveTab('registry')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[#011f3b]/5 text-[#011f3b] border border-[#011f3b]/15 hover:bg-[#011f3b]/10 transition"
              title="View Tested Candidates Registry"
            >
              <span className="material-symbols-outlined text-[15px] text-[#011f3b]">how_to_reg</span>
              <span>Tested: <strong className="tabular-nums font-bold">{testedCount}</strong></span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Strictly NO Batch CSV option as requested) */}
        <div className="flex items-center justify-between pt-1">
          <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('single')}
              className={`pb-2.5 pt-1 px-1 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'single'
                  ? 'border-[#011f3b] text-[#011f3b]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">person_search</span>
              <span>Student Live Evaluation</span>
            </button>

            <button
              onClick={() => setActiveTab('registry')}
              className={`pb-2.5 pt-1 px-1 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'registry'
                  ? 'border-[#011f3b] text-[#011f3b]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">badge</span>
              <span>Session Registry</span>
              {testedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#011f3b] text-white font-bold tabular-nums">
                  {testedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('guidelines')}
              className={`pb-2.5 pt-1 px-1 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'guidelines'
                  ? 'border-[#011f3b] text-[#011f3b]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">policy</span>
              <span>Placement Criteria & Tiers</span>
            </button>
          </nav>

          {activeTab === 'single' && (
            <button
              onClick={onReset}
              className="text-xs text-slate-500 hover:text-[#b91c1c] font-medium flex items-center gap-1 pb-2 px-2.5 py-1 rounded hover:bg-slate-50 transition-colors shrink-0"
              title="Reset all form fields"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              <span className="hidden sm:inline">Reset Form</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
