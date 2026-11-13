import React, { useState, useEffect, useCallback } from 'react';
import Lenis from 'lenis';
import TopHeader from './components/TopHeader';
import StudentInputForm from './components/StudentInputForm';
import PlacementResultCard from './components/PlacementResultCard';
import TestedRegistryView from './components/TestedRegistryView';
import PlacementGuidelinesModal from './components/PlacementGuidelinesModal';
import PrintSlipModal from './components/PrintSlipModal';

import { EMPTY_STUDENT_PROFILE } from './presets';
import { checkHealth, predictPlacement } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('single');
  
  // Strictly clean initial profile: NO dummy/mock data preloaded
  const [profile, setProfile] = useState(EMPTY_STUDENT_PROFILE);
  const [prediction, setPrediction] = useState(null);
  const [autoCalculate, setAutoCalculate] = useState(false);
  
  // Session Registry of Tested Candidates
  const [registry, setRegistry] = useState(() => {
    try {
      const saved = sessionStorage.getItem('placement_registry');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [printStudent, setPrintStudent] = useState(null);

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    let animationFrameId;
    function raf(time) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }
    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  // Sync registry to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('placement_registry', JSON.stringify(registry));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }, [registry]);

  // Check backend health on initial mount
  useEffect(() => {
    checkHealth()
      .then(h => {
        if (h && h.status === 'healthy') setBackendOnline(true);
      })
      .catch(() => setBackendOnline(false));
  }, []);

  // Format profile to ensure valid data types for pipeline inference
  const prepareProfileForInference = (raw) => {
    return {
      name: raw.name ? String(raw.name).trim() : 'Candidate',
      uid: raw.uid ? String(raw.uid).trim() : 'N/A',
      branch: raw.branch || 'CSE',
      college_tier: raw.college_tier || 'Tier-2',
      cgpa: raw.cgpa !== '' ? parseFloat(raw.cgpa) : 7.0,
      backlogs: raw.backlogs !== '' ? parseInt(raw.backlogs) : 0,
      coding_skills: raw.coding_skills !== '' ? parseFloat(raw.coding_skills) : 5.0,
      dsa_score: raw.dsa_score !== '' ? parseFloat(raw.dsa_score) : 5.0,
      aptitude_score: raw.aptitude_score !== '' ? parseFloat(raw.aptitude_score) : 60.0,
      communication_skills: raw.communication_skills !== '' ? parseFloat(raw.communication_skills) : 6.0,
      ml_knowledge: raw.ml_knowledge !== '' ? parseFloat(raw.ml_knowledge) : 4.0,
      system_design: raw.system_design !== '' ? parseFloat(raw.system_design) : 4.0,
      internships: raw.internships !== '' ? parseInt(raw.internships) : 0,
      projects_count: raw.projects_count !== '' ? parseInt(raw.projects_count) : 2,
      certifications: raw.certifications !== '' ? parseInt(raw.certifications) : 0,
      hackathons: raw.hackathons !== '' ? parseInt(raw.hackathons) : 0,
      open_source_contributions: raw.open_source_contributions !== '' ? parseInt(raw.open_source_contributions) : 0,
      extracurriculars: raw.extracurriculars !== '' ? parseInt(raw.extracurriculars) : 0,
    };
  };

  // Run placement percentage prediction over our model data
  const handleCalculate = useCallback(async (currentProfile = profile) => {
    if (currentProfile.cgpa === '' && !currentProfile.name && !currentProfile.uid) {
      setError("Please input the student details (Name, UID, and CGPA) to calculate placement percentage.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sanitized = prepareProfileForInference(currentProfile);
      const res = await predictPlacement(sanitized, 0.50);
      setPrediction(res);
      setBackendOnline(true);
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err.message || "Failed to calculate placement percentage. Ensure backend API is running.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Realtime auto-calculate when toggle is enabled
  useEffect(() => {
    if (autoCalculate && (profile.cgpa !== '' || profile.name || profile.uid)) {
      const debounce = setTimeout(() => {
        handleCalculate(profile);
      }, 350);
      return () => clearTimeout(debounce);
    }
  }, [profile, autoCalculate, handleCalculate]);

  // Reset form to clean empty state (NO mock data!)
  const handleReset = () => {
    setProfile(EMPTY_STUDENT_PROFILE);
    setPrediction(null);
    setError(null);
  };

  // Save current student evaluation to registry
  const handleSaveToRegistry = (customPred = prediction, customProf = profile) => {
    if (!customPred) return;

    const recordId = `${customProf.uid || 'REC'}_${Date.now()}`;
    const newEntry = {
      id: recordId,
      name: customProf.name || 'Candidate',
      uid: customProf.uid || 'N/A',
      branch: customProf.branch || 'CSE',
      probability: customPred.placement_probability,
      isPlaced: customPred.predicted_status === 1,
      confidence: customPred.confidence,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      profile: { ...customProf }
    };

    setRegistry(prev => [newEntry, ...prev]);
  };

  const handleSelectFromRegistry = (item) => {
    if (!item) return;
    setProfile(item.profile || EMPTY_STUDENT_PROFILE);
    setPrediction({
      name: item.name,
      uid: item.uid,
      predicted_status: item.isPlaced ? 1 : 0,
      placement_label: item.isPlaced ? 'Placed' : 'Not Placed',
      placement_probability: item.probability,
      decision_threshold: 0.50,
      confidence: item.confidence || 'Moderate',
      model_version: 'placement-xgb-v1',
      disclaimer: 'Institutional placement evaluation based on trained student records.'
    });
    setActiveTab('single');
  };

  const handleDeleteFromRegistry = (id) => {
    setRegistry(prev => prev.filter(r => r.id !== id));
  };

  const handleClearRegistry = () => {
    if (window.confirm("Clear all student evaluation records from the session registry?")) {
      setRegistry([]);
    }
  };

  const isCurrentSaved = prediction && registry.some(
    r => r.uid === profile.uid && r.name === profile.name && Math.abs(r.probability - prediction.placement_probability) < 0.001
  );

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 antialiased font-sans flex flex-col selection:bg-[#011f3b] selection:text-white">
      
      {/* Top Header */}
      <TopHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendOnline={backendOnline}
        testedCount={registry.length}
        onReset={handleReset}
      />

      {/* Main Spacious Testing Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#b91c1c] text-[18px]">error</span>
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-[#b91c1c] hover:text-rose-900 font-bold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Single Student Live Testing (Spacious & Dynamic) */}
        {activeTab === 'single' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Left Column: Input Form (Spacious, Dynamic, Mobile-Optimized) */}
            <div className="lg:col-span-7">
              <StudentInputForm
                profile={profile}
                setProfile={setProfile}
                onCalculate={() => handleCalculate(profile)}
                onReset={handleReset}
                loading={loading}
                autoCalculate={autoCalculate}
                setAutoCalculate={setAutoCalculate}
              />
            </div>

            {/* Right Column: Live Placement Result Dossier */}
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <PlacementResultCard
                prediction={prediction}
                profile={profile}
                loading={loading}
                onSaveToRegistry={() => handleSaveToRegistry(prediction, profile)}
                onOpenPrintSlip={() => setPrintStudent({ ...prediction, profile })}
                isSavedInRegistry={isCurrentSaved}
              />
            </div>

          </div>
        )}

        {/* Tab 2: Tested Students Registry */}
        {activeTab === 'registry' && (
          <TestedRegistryView
            registry={registry}
            onSelectStudent={handleSelectFromRegistry}
            onDeleteRecord={handleDeleteFromRegistry}
            onClearRegistry={handleClearRegistry}
            onOpenPrintSlip={(item) => setPrintStudent(item)}
          />
        )}

        {/* Tab 3: Placement Criteria & Guidelines */}
        {activeTab === 'guidelines' && (
          <PlacementGuidelinesModal />
        )}

      </main>

      {/* Floating Dynamic Bottom Bar on Mobile for Instant Placement Feedback */}
      {prediction && activeTab === 'single' && (
        <aside aria-label="Quick Evaluation Summary" className="lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-[#011f3b] text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-sm">
              {prediction.predicted_status === 1 ? '✓' : '!'}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                {profile.name || 'Candidate'}
              </span>
              <span className="text-base font-black tabular-nums">
                {(prediction.placement_probability * 100).toFixed(1)}% Placement Likelihood
              </span>
            </div>
          </div>

          <button
            onClick={() => handleSaveToRegistry(prediction, profile)}
            className="px-3 py-1.5 rounded-xl bg-white text-[#011f3b] text-xs font-bold shadow-xs"
          >
            {isCurrentSaved ? 'Saved' : 'Save'}
          </button>
        </aside>
      )}

      {/* Printable Evaluation Slip Modal */}
      {printStudent && (
        <PrintSlipModal
          student={printStudent}
          onClose={() => setPrintStudent(null)}
        />
      )}

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#011f3b]">Chandigarh University</span>
            <span>•</span>
            <span className="text-slate-600">Corporate Resource Center & Placement Cell</span>
          </div>
          <div>
            PlacementIQ Engine • Official Institutional Model
          </div>
        </div>
      </footer>

    </div>
  );
}
