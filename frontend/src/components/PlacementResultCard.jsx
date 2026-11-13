import React from 'react';

export default function PlacementResultCard({
  prediction,
  profile,
  loading,
  onSaveToRegistry,
  onOpenPrintSlip,
  isSavedInRegistry
}) {
  if (!prediction) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 flex flex-col items-center justify-center text-center h-full min-h-[460px]">
        <div className="w-14 h-14 rounded-2xl bg-[#011f3b]/5 text-[#011f3b] flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]">fact_check</span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">
          Awaiting Student Data Input
        </h3>

        <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
          Input student Name, UID, academic & skill metrics on the left, then click{' '}
          <strong className="text-[#011f3b] font-semibold">"Calculate Placement Percentage"</strong>{' '}
          to run inference over trained institutional data.
        </p>

        {/* Benchmarks Quick Card */}
        <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-left">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-[#011f3b]">policy</span>
            <span>Placement Cell Benchmarks</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#011f3b]"></span>
              <span>Min CGPA: <strong>7.00+</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b91c1c]"></span>
              <span>Backlogs: <strong>0 Preferred</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Aptitude: <strong>60%+ Cutoff</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
              <span>Coding/DSA: <strong>6.0+ / 10</strong></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const prob = prediction.placement_probability;
  const probPercent = (prob * 100).toFixed(1);
  const isPlaced = prediction.predicted_status === 1;

  // Universal Placement Readiness Classification
  let driveTier = '';
  let driveBadgeClass = '';
  let driveDesc = '';

  if (prob >= 0.80 && (profile.backlogs === 0 || profile.backlogs === '0')) {
    driveTier = 'High Placement Probability (Tier 1)';
    driveBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    driveDesc = 'Candidate demonstrates strong academic, technical, and communication indicators with high placement readiness.';
  } else if (prob >= 0.65) {
    driveTier = 'Competitive Profile (Tier 2)';
    driveBadgeClass = 'bg-blue-50 text-blue-900 border-blue-200';
    driveDesc = 'Candidate comfortably meets institutional benchmarks across technical and academic standards.';
  } else if (prob >= 0.50) {
    driveTier = 'Moderate Placement Likelihood (Tier 3)';
    driveBadgeClass = 'bg-amber-50 text-amber-900 border-amber-300';
    driveDesc = 'Candidate satisfies baseline recruitment criteria; focused practice in core skills is recommended.';
  } else {
    driveTier = 'Preparation Required (At Risk)';
    driveBadgeClass = 'bg-rose-50 text-rose-900 border-rose-300';
    driveDesc = 'Current metrics fall below primary benchmark cutoffs. Targeted training and backlog clearance advised.';
  }

  // 4-Pillar Scorecard Calculations
  const cgpaVal = parseFloat(profile.cgpa) || 0;
  const backlogsVal = parseInt(profile.backlogs) || 0;
  const codingVal = parseFloat(profile.coding_skills) || 0;
  const dsaVal = parseFloat(profile.dsa_score) || 0;
  const aptVal = parseFloat(profile.aptitude_score) || 0;
  const commVal = parseFloat(profile.communication_skills) || (profile.communication_skills === '' ? 6.0 : 0);
  const sysVal = parseFloat(profile.system_design) || 0;
  const mlVal = parseFloat(profile.ml_knowledge) || 0;
  const internVal = parseInt(profile.internships) || 0;
  const projVal = parseInt(profile.projects_count) || 0;
  const certVal = parseInt(profile.certifications) || 0;
  const ossVal = parseInt(profile.open_source_contributions) || 0;

  const academicScore = Math.min(100, Math.max(0, Math.round(((cgpaVal / 10) * 100) - (backlogsVal * 20))));
  const technicalScore = Math.min(100, Math.max(0, Math.round(((codingVal + dsaVal + sysVal + mlVal) / 40) * 100)));
  const practicalScore = Math.min(100, Math.max(0, Math.round((internVal * 30 + projVal * 15 + certVal * 10 + ossVal * 15))));
  // Aptitude & Communication Pillar: 60% aptitude score + 40% communication rating
  const employabilityScore = Math.min(100, Math.max(0, Math.round((aptVal * 0.6) + ((commVal / 10) * 40))));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col gap-5">
      
      {/* Student Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 uppercase">
              {profile.branch} • {profile.college_tier}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">
              UID: <strong className="text-slate-800 font-mono">{profile.uid || 'N/A'}</strong>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {profile.name || 'Candidate'}
          </h2>
        </div>

        {/* Verdict Stamp */}
        <div className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 self-start sm:self-auto ${
          isPlaced 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
            : 'bg-rose-50 text-rose-800 border-rose-300'
        }`}>
          <span className="material-symbols-outlined text-[16px]">
            {isPlaced ? 'check_circle' : 'warning'}
          </span>
          <span>{isPlaced ? 'ELIGIBLE / PLACED' : 'NEEDS PREP / AT RISK'}</span>
        </div>
      </div>

      {/* Hero Placement Likelihood Card (CU Navy Theme) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#011f3b] text-white flex items-center justify-between shadow-sm relative overflow-hidden">
        {/* Subtle background emblem accent */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/5 transform skew-x-12 pointer-events-none"></div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
            Calculated Placement Likelihood
          </span>
          <div className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums">
            {probPercent}%
          </div>
          <div className="text-xs text-slate-300 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Model Confidence: <strong className="text-white">{prediction.confidence}</strong></span>
          </div>
        </div>

        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white/20 border-t-emerald-400 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl sm:text-3xl text-white">
            {isPlaced ? 'trending_up' : 'trending_down'}
          </span>
        </div>
      </div>

      {/* Universal Classification Banner */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
          Placement Readiness Classification
        </span>
        <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${driveBadgeClass}`}>
          {driveTier}
        </div>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
          {driveDesc}
        </p>
      </div>

      {/* 4 Pillars Scorecard - Clean & Non-Cramped (Fixes Image 2 collision!) */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-[#011f3b]">analytics</span>
          <span>Placement Readiness Scorecard (4 Pillars)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Pillar 1: Academics */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800">Academics</span>
              <span className="text-xs font-bold text-[#011f3b] tabular-nums shrink-0">{academicScore}/100</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${academicScore >= 70 ? 'bg-emerald-500' : academicScore >= 50 ? 'bg-blue-600' : 'bg-rose-500'}`}
                style={{ width: `${academicScore}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>CGPA: <strong>{cgpaVal.toFixed(2)}</strong></span>
              <span className={backlogsVal > 0 ? 'text-[#b91c1c] font-semibold' : ''}>{backlogsVal} Backlogs</span>
            </div>
          </div>

          {/* Pillar 2: Tech & DSA */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800">Technical & DSA</span>
              <span className="text-xs font-bold text-[#011f3b] tabular-nums shrink-0">{technicalScore}/100</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${technicalScore >= 70 ? 'bg-indigo-600' : technicalScore >= 50 ? 'bg-blue-600' : 'bg-amber-500'}`}
                style={{ width: `${technicalScore}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Coding: <strong>{codingVal.toFixed(1)}</strong></span>
              <span>DSA: <strong>{dsaVal.toFixed(1)}</strong></span>
            </div>
          </div>

          {/* Pillar 3: Practical Portfolio */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800">Practical Portfolio</span>
              <span className="text-xs font-bold text-[#011f3b] tabular-nums shrink-0">{practicalScore}/100</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${practicalScore >= 60 ? 'bg-emerald-600' : practicalScore >= 35 ? 'bg-blue-500' : 'bg-amber-500'}`}
                style={{ width: `${practicalScore}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>{internVal} Internships</span>
              <span>{projVal} Projects</span>
            </div>
          </div>

          {/* Pillar 4: Aptitude & Communication (FIXED - High contrast, no collision!) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800">Aptitude & Comm</span>
              <span className="text-xs font-bold text-[#011f3b] tabular-nums shrink-0">{employabilityScore}/100</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${employabilityScore >= 70 ? 'bg-emerald-500' : employabilityScore >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                style={{ width: `${employabilityScore}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Aptitude: <strong>{aptVal}%</strong></span>
              <span>Comm: <strong>{commVal.toFixed(1)}/10</strong></span>
            </div>
          </div>

        </div>
      </div>

      {/* Placement Cell Guidance */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#011f3b] mb-1.5 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-[#011f3b]">assignment_turned_in</span>
          <span>Placement Advisory Notes</span>
        </h5>
        <ul className="text-xs text-slate-700 space-y-1">
          {backlogsVal > 0 && (
            <li className="text-[#b91c1c] font-semibold flex items-center gap-1">
              <span>⚠️</span>
              <span>Active backlogs ({backlogsVal}) detected. Clearing outstanding backlogs is recommended to maximize recruitment eligibility.</span>
            </li>
          )}
          {commVal < 6.0 && (
            <li className="text-amber-800 flex items-center gap-1">
              <span>•</span>
              <span>Communication rating ({commVal}/10) is below standard interview bar. Advise participating in communication and mock interview sessions.</span>
            </li>
          )}
          {cgpaVal >= 8.0 && backlogsVal === 0 && dsaVal >= 7.0 && (
            <li className="text-emerald-800 font-semibold flex items-center gap-1">
              <span>★</span>
              <span>Strong candidate profile: demonstrates solid academic performance and algorithmic readiness.</span>
            </li>
          )}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onOpenPrintSlip}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">print</span>
          <span>Print Evaluation Slip</span>
        </button>

        <button
          type="button"
          onClick={onSaveToRegistry}
          className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            isSavedInRegistry
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-[#011f3b] hover:bg-[#002b5c] text-white shadow-xs'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isSavedInRegistry ? 'done' : 'save'}
          </span>
          <span>{isSavedInRegistry ? 'Saved in Registry' : 'Save to Registry'}</span>
        </button>
      </div>

    </div>
  );
}
