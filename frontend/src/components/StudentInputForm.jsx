import React from 'react';
import { QUICK_TEST_CASES } from '../presets';

export default function StudentInputForm({
  profile,
  setProfile,
  onCalculate,
  onReset,
  loading,
  autoCalculate,
  setAutoCalculate
}) {
  const handleChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberChange = (field, value, min = 0, max = 10) => {
    if (value === '') {
      handleChange(field, '');
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      handleChange(field, Math.max(min, Math.min(max, num)));
    }
  };

  const handleIncrement = (field, delta, min = 0, max = 20) => {
    const current = parseInt(profile[field]) || 0;
    const next = Math.max(min, Math.min(max, current + delta));
    handleChange(field, next);
  };

  const handleSelectSample = (caseId) => {
    const selected = QUICK_TEST_CASES.find(c => c.id === caseId);
    if (selected) {
      setProfile({ ...selected.profile });
    }
  };

  const branches = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'Chemical'];
  const tiers = ['Tier-1', 'Tier-2', 'Tier-3'];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Quick Test Bar (Humanized Viva Testing) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Quick Viva & Demo Test Cases
          </span>
          <p className="text-xs text-slate-600 mt-0.5">
            Click any student to test live without manual re-typing
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {QUICK_TEST_CASES.map(tc => {
            const isActive = profile.name === tc.profile.name;
            return (
              <button
                key={tc.id}
                type="button"
                onClick={() => handleSelectSample(tc.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-[#011f3b] text-white border-[#011f3b] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{tc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Student Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7 flex flex-col gap-7">
        
        {/* Section 1: Candidate Identity */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <span className="w-2 h-2 rounded-full bg-[#011f3b]"></span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              1. Student Identity & Discipline
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Student Full Name <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Aditya Sharma"
                className="w-full text-sm font-medium px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:border-[#011f3b] focus:ring-1 focus:ring-[#011f3b] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                University UID / Roll Number <span className="text-[#b91c1c]">*</span>
              </label>
              <input
                type="text"
                value={profile.uid || ''}
                onChange={(e) => handleChange('uid', e.target.value)}
                placeholder="e.g. 21BCS10101"
                className="w-full text-sm font-medium px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:border-[#011f3b] focus:ring-1 focus:ring-[#011f3b] outline-none transition uppercase font-mono"
              />
            </div>
          </div>

          {/* Branch Pill Selector */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Engineering Branch
            </label>
            <div className="flex flex-wrap gap-1.5">
              {branches.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleChange('branch', b)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    profile.branch === b
                      ? 'bg-[#011f3b] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* College Tier Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Campus Tier Rating
            </label>
            <div className="grid grid-cols-3 gap-2">
              {tiers.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleChange('college_tier', t)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                    profile.college_tier === t
                      ? 'bg-[#011f3b]/5 text-[#011f3b] border-[#011f3b] font-bold'
                      : 'bg-slate-50/60 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Academic Standing */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <span className="w-2 h-2 rounded-full bg-[#003d8c]"></span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              2. Academic Standing & Eligibility
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* CGPA */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">CGPA (0.00 – 10.00)</label>
                <span className="text-xs font-bold text-[#011f3b] tabular-nums">
                  {profile.cgpa !== '' ? Number(profile.cgpa).toFixed(2) : '--'}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={profile.cgpa}
                onChange={(e) => handleNumberChange('cgpa', e.target.value, 0, 10)}
                placeholder="e.g. 8.25"
                className="w-full text-base font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-[#011f3b] outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1.5 block">Placement Cutoff: 7.00+</span>
            </div>

            {/* Backlogs */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Active Backlogs</label>
                <span className={`text-xs font-bold tabular-nums ${profile.backlogs > 0 ? 'text-[#b91c1c]' : 'text-emerald-700'}`}>
                  {profile.backlogs || 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleIncrement('backlogs', -1, 0, 10)}
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center"
                >
                  -
                </button>
                <div className="flex-1 text-center font-bold text-base py-1.5 bg-white border border-slate-200 rounded-lg tabular-nums">
                  {profile.backlogs || 0}
                </div>
                <button
                  type="button"
                  onClick={() => handleIncrement('backlogs', 1, 0, 10)}
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <span className={`text-[10px] mt-1.5 block font-medium ${profile.backlogs > 0 ? 'text-[#b91c1c]' : 'text-emerald-700'}`}>
                {profile.backlogs === 0 ? '✓ Clean Record (No Backlogs)' : '⚠️ Active Backlogs Detected'}
              </span>
            </div>

            {/* Aptitude Score */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Aptitude Test Score</label>
                <span className="text-xs font-bold text-[#011f3b] tabular-nums">
                  {profile.aptitude_score !== '' ? `${profile.aptitude_score}%` : '--'}
                </span>
              </div>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={profile.aptitude_score}
                onChange={(e) => handleNumberChange('aptitude_score', e.target.value, 0, 100)}
                placeholder="e.g. 75"
                className="w-full text-base font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-[#011f3b] outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1.5 block">Round 1 Screening Cutoff: 60%+</span>
            </div>
          </div>
        </div>

        {/* Section 3: Technical & Problem Solving */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <span className="w-2 h-2 rounded-full bg-[#011f3b]"></span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              3. Technical & Algorithmic Competencies (0.0 – 10.0)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Coding Skills Slider */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700">Coding Skills</label>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-xs text-[#011f3b] tabular-nums">
                  {profile.coding_skills !== '' ? Number(profile.coding_skills).toFixed(1) : '--'} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={profile.coding_skills || 0}
                onChange={(e) => handleChange('coding_skills', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.0 Basic</span>
                <span className="text-slate-600 font-medium">Placement Benchmark: 6.0+</span>
                <span>10.0 Expert</span>
              </div>
            </div>

            {/* DSA Score Slider */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700">Data Structures & Algorithms (DSA)</label>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-xs text-[#011f3b] tabular-nums">
                  {profile.dsa_score !== '' ? Number(profile.dsa_score).toFixed(1) : '--'} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={profile.dsa_score || 0}
                onChange={(e) => handleChange('dsa_score', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.0 Array/Strings</span>
                <span className="text-slate-600 font-medium">Recommended Benchmark: 7.0+</span>
                <span>10.0 DP/Graphs</span>
              </div>
            </div>

            {/* System Design */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700">System Design Proficiency</label>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-xs text-[#011f3b] tabular-nums">
                  {profile.system_design !== '' ? Number(profile.system_design).toFixed(1) : '--'} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={profile.system_design || 0}
                onChange={(e) => handleChange('system_design', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Architecture, DB schemas & scalability</span>
            </div>

            {/* ML Knowledge */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700">Machine Learning & AI</label>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-xs text-[#011f3b] tabular-nums">
                  {profile.ml_knowledge !== '' ? Number(profile.ml_knowledge).toFixed(1) : '--'} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={profile.ml_knowledge || 0}
                onChange={(e) => handleChange('ml_knowledge', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">AI fundamentals, neural nets & model deployment</span>
            </div>
          </div>
        </div>

        {/* Section 4: DEDICATED COMMUNICATION & SOFT SKILLS (Explicitly Requested) */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <span className="w-2 h-2 rounded-full bg-[#b91c1c]"></span>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                4. Communication & Interview Soft Skills
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                Evaluated in Result Criteria
              </span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800">
                  Communication & HR Interview Readiness Rating (0.0 – 10.0)
                </label>
                <p className="text-[11px] text-slate-500">
                  Reflects verbal articulation, resume defense, and behavioural interview composure
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#011f3b] tabular-nums">
                  {profile.communication_skills !== '' ? Number(profile.communication_skills).toFixed(1) : '6.0'}
                </span>
                <span className="text-xs font-semibold text-slate-500">/ 10</span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={profile.communication_skills !== '' ? profile.communication_skills : 6.0}
              onChange={(e) => handleChange('communication_skills', parseFloat(e.target.value))}
              className="w-full my-1"
            />

            {/* Quick Human Presets for Communication */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: 'Basic (4.0)', val: 4.0 },
                { label: 'Conversational (6.0)', val: 6.0 },
                { label: 'Campus Ready (7.5)', val: 7.5 },
                { label: 'Debater / High Impact (9.0)', val: 9.0 },
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => handleChange('communication_skills', item.val)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                    Number(profile.communication_skills) === item.val
                      ? 'bg-[#011f3b] text-white border-[#011f3b]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: Practical Portfolio & Experience */}
        <div>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <span className="w-2 h-2 rounded-full bg-[#011f3b]"></span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              5. Practical Portfolio & Extracurriculars
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { key: 'internships', label: 'Internships', sub: 'Industry verified', max: 10 },
              { key: 'projects_count', label: 'Major Projects', sub: 'Deployed/Git', max: 20 },
              { key: 'certifications', label: 'Certifications', sub: 'NPTEL/Cloud', max: 20 },
              { key: 'hackathons', label: 'Hackathons', sub: 'Competitions', max: 15 },
              { key: 'open_source_contributions', label: 'Open Source', sub: 'GitHub PRs', max: 15 },
              { key: 'extracurriculars', label: 'Club / Events', sub: 'Leadership', max: 15 },
            ].map(item => {
              const val = profile[item.key] || 0;
              return (
                <div key={item.key} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block truncate">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block mb-2">{item.sub}</span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handleIncrement(item.key, -1, 0, item.max)}
                      className="w-7 h-7 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-[#011f3b] tabular-nums">{val}</span>
                    <button
                      type="button"
                      onClick={() => handleIncrement(item.key, 1, 0, item.max)}
                      className="w-7 h-7 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoCalculate}
              onChange={(e) => setAutoCalculate(e.target.checked)}
              className="w-4 h-4 text-[#011f3b] rounded border-slate-300 focus:ring-[#011f3b]"
            />
            <span className="text-xs font-semibold text-slate-700">
              Auto-calculate placement % on input change
            </span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onReset}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={onCalculate}
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#011f3b] hover:bg-[#002b5c] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[17px]">calculate</span>
                  <span>Calculate Placement Percentage</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
