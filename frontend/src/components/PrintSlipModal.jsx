import React from 'react';

export default function PrintSlipModal({ student, onClose }) {
  if (!student) return null;

  const p = student.profile || {};
  const isPlaced = student.isPlaced !== undefined ? student.isPlaced : (student.predicted_status === 1);
  const probPercent = (student.probability !== undefined 
    ? student.probability * 100 
    : (student.placement_probability || 0) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Printable Content Area */}
        <div id="printableSlip" className="space-y-6">
          
          {/* Official University Header */}
          <div className="text-center pb-4 border-b-2 border-[#011f3b] flex flex-col items-center">
            <img 
              src="/cu_logo.png" 
              alt="Chandigarh University" 
              className="h-12 w-auto object-contain mb-2"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="inline-block px-3 py-0.5 rounded bg-[#011f3b] text-white font-bold text-[10px] uppercase tracking-widest mb-1">
              Chandigarh University
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Corporate Resource Center & Placement Cell
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Official Student Placement Readiness & Eligibility Evaluation Dossier
            </p>
          </div>

          {/* Student Identity Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Candidate Name</span>
              <span className="font-bold text-slate-900 text-sm">{student.name || 'Student Candidate'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Student UID / Roll No</span>
              <span className="font-mono font-bold text-[#011f3b] text-sm">{student.uid || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Branch / Discipline</span>
              <span className="font-bold text-slate-900 text-sm">{p.branch || 'CSE'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">College Tier</span>
              <span className="font-bold text-slate-900 text-sm">{p.college_tier || 'Tier-2'}</span>
            </div>
          </div>

          {/* Model Prediction Outcome Banner */}
          <div className={`p-5 rounded-xl border flex items-center justify-between ${
            isPlaced 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
                Calculated Placement Likelihood
              </span>
              <div className="text-4xl font-black mt-0.5 tabular-nums">
                {probPercent}%
              </div>
              <span className="text-xs font-semibold mt-1 block">
                Model Verdict: <strong>{isPlaced ? 'ELIGIBLE / PLACED' : 'NEEDS INTERVENTION / AT RISK'}</strong>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
                Decision Cutoff
              </span>
              <span className="text-xl font-bold">50.0%</span>
              <span className="text-[11px] block mt-1">
                Status: <strong>{isPlaced ? 'Qualified for Drives' : 'Remedial Prep Required'}</strong>
              </span>
            </div>
          </div>

          {/* Evaluated Student Metrics Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Evaluated Candidate Performance Metrics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">CGPA</span>
                <span className="font-bold text-slate-900 tabular-nums">{p.cgpa ? Number(p.cgpa).toFixed(2) : '--'}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Backlogs</span>
                <span className={`font-bold tabular-nums ${p.backlogs > 0 ? 'text-[#b91c1c]' : 'text-emerald-700'}`}>{p.backlogs || 0}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Coding / DSA</span>
                <span className="font-bold text-slate-900 tabular-nums">{p.coding_skills || '--'} / {p.dsa_score || '--'}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Aptitude & Comm</span>
                <span className="font-bold text-slate-900 tabular-nums">{p.aptitude_score || '--'}% • {p.communication_skills || '--'}/10</span>
              </div>
            </div>
          </div>

          {/* CRC Placement Advisory Sign-off */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
            <div>
              <p>Generated by: PlacementIQ System</p>
              <p>Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-slate-400 mb-1"></div>
              <span>Authorized CRC Placement Officer</span>
            </div>
          </div>

        </div>

        {/* Modal Action Controls */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 rounded-xl bg-[#011f3b] hover:bg-[#002b5c] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print Official Slip</span>
          </button>
        </div>

      </div>
    </div>
  );
}
