import React from 'react';

export default function PlacementGuidelinesModal() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 flex flex-col gap-6">
      
      <div className="pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#011f3b] text-[24px]">gavel</span>
          <h2 className="text-lg font-bold text-slate-900">Placement Cell Criteria & Evaluation Bands</h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Universal institutional readiness benchmarks applied during candidate evaluations
        </p>
      </div>

      {/* Generic Universal Bands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Tier 1 / Band 1 */}
        <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Tier 1 / High Readiness
              </span>
              <span className="text-xs font-bold text-emerald-900">&ge; 80% Likelihood</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Advanced Placement Readiness</h3>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Candidates who demonstrate exceptional academic consistency, advanced algorithmic problem solving, and corporate-ready communication.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 border-t border-emerald-200/80 pt-3">
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-emerald-700">check_circle</span>
                <span>Minimum CGPA: <strong>8.00+</strong> (0 Backlogs)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-emerald-700">check_circle</span>
                <span>Coding & DSA: <strong>7.5+ / 10</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-emerald-700">check_circle</span>
                <span>Communication: <strong>7.5+ / 10</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-emerald-700">check_circle</span>
                <span>Practical Portfolio: <strong>Internships & Major Projects</strong></span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-200 text-[11px] font-bold text-emerald-800">
            Status: Fully Placement Ready
          </div>
        </div>

        {/* Tier 2 / Band 2 */}
        <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#011f3b] bg-blue-100 px-2.5 py-0.5 rounded-full">
                Tier 2 / Competitive
              </span>
              <span className="text-xs font-bold text-[#011f3b]">65% – 79% Likelihood</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Standard Placement Readiness</h3>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Candidates comfortably meeting institutional benchmarks across core technical skills, academic performance, and aptitude assessments.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 border-t border-blue-200/80 pt-3">
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#011f3b]">check_circle</span>
                <span>Minimum CGPA: <strong>7.00+</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#011f3b]">check_circle</span>
                <span>Coding & DSA: <strong>6.0+ / 10</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#011f3b]">check_circle</span>
                <span>Aptitude Score: <strong>65.0%+</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#011f3b]">check_circle</span>
                <span>Communication: <strong>6.0+ / 10</strong></span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-blue-200 text-[11px] font-bold text-[#011f3b]">
            Status: Qualified for Core Recruitment
          </div>
        </div>

        {/* Tier 3 / Band 3 */}
        <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Tier 3 / Moderate
              </span>
              <span className="text-xs font-bold text-amber-900">50% – 64% Likelihood</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Baseline Eligibility</h3>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Candidates meeting baseline criteria who can enhance their prospects with targeted preparation in algorithmic coding and verbal presentation.
            </p>
            <ul className="text-xs text-slate-700 space-y-1.5 border-t border-amber-200/80 pt-3">
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-amber-700">check_circle</span>
                <span>Minimum CGPA: <strong>6.00 – 6.50</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-amber-700">check_circle</span>
                <span>Backlogs: <strong>Max 1 (Clearance Required)</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-amber-700">check_circle</span>
                <span>Aptitude Score: <strong>60.0%+</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-amber-700">check_circle</span>
                <span>Communication: <strong>5.0+ / 10</strong></span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200 text-[11px] font-bold text-amber-800">
            Status: Eligible (Skill Reinforcement Advised)
          </div>
        </div>

      </div>

      {/* Universal Guidelines */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[17px] text-[#011f3b]">info</span>
          <span>Core Evaluation Guidelines</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#011f3b] mt-1.5 shrink-0"></span>
            <span><strong>Backlogs Clearance:</strong> Candidates are strongly encouraged to have zero active backlogs to ensure maximum eligibility across all campus recruitment rounds.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#011f3b] mt-1.5 shrink-0"></span>
            <span><strong>Aptitude & Communication Thresholds:</strong> Preliminary elimination rounds universally require a minimum of 60% in quantitative aptitude and standard verbal fluency.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
