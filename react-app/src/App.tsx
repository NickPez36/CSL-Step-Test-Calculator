import { useState, useRef, useCallback } from 'react';
import {
  SessionDetails,
  DataInputTable,
  Charts,
  Results,
  TrainingZones,
  EfficiencyTable,
  generatePDF,
  downloadPDF,
  SessionLibraryPanel,
  ToastStack,
  ComparisonView,
} from './components';
import { useAuth } from './auth/useAuth';
import { isFirebaseConfigured } from './services/firebaseConfig';
import { useToastStack } from './hooks/useToastStack';
import type { ChartsRef } from './components';
import { calculateThresholds, parseTableData } from './services/calculations';
import type {
  SessionDetails as SessionDetailsType,
  StepData,
  TableType,
  CalculationResult,
  SavedTestSession,
} from './types';

function App() {
  const { role, signOutApp } = useAuth();
  const viewerMode = role === 'viewer';

  // Session details state
  const [sessionDetails, setSessionDetails] = useState<SessionDetailsType>({
    athleteName: '',
    testDate: '',
    boatClass: 'K1 Men',
    protocol: '',
    comments: '',
    temperature: '',
    windSpeed: '',
  });

  // Table state
  const [tableType, setTableType] = useState<TableType>('hr');
  const [inputData, setInputData] = useState<StepData[]>(() => {
    // Initialize with 7 empty rows
    return Array.from({ length: 7 }, (_, i) => ({
      step: i + 1,
      hrPlanned: null,
      hrAchieved: 0,
      speed: 0,
      lactate: 0,
      strokeRate: null,
      time: null,
    }));
  });

  // Calculation results
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PDF generation state
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Chart ref for getting images
  const chartsRef = useRef<ChartsRef>(null);

  const { toasts, push: pushToast, dismiss: dismissToast } = useToastStack();

  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'calculator' | 'compare'>('calculator');

  const handleLoadSavedSession = useCallback((session: SavedTestSession) => {
    setLoadedSessionId(session.id);
    setSessionDetails(session.sessionDetails);
    setTableType(session.tableType);
    setInputData(session.inputData);
    setError(null);
    try {
      const parsedData = parseTableData(session.inputData, session.tableType);
      const calcResult = calculateThresholds(parsedData);
      setResult(calcResult);
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  }, []);

  // Handle table type change - reset data
  const handleTableTypeChange = useCallback((type: TableType) => {
    setTableType(type);
    setInputData(
      Array.from({ length: inputData.length }, (_, i) => ({
        step: i + 1,
        hrPlanned: null,
        hrAchieved: 0,
        speed: 0,
        lactate: 0,
        strokeRate: null,
        time: null,
      }))
    );
    setLoadedSessionId(null);
    setResult(null);
    setError(null);
  }, [inputData.length]);

  // Calculate thresholds
  const handleCalculate = useCallback(() => {
    try {
      setError(null);
      const parsedData = parseTableData(inputData, tableType);
      const calcResult = calculateThresholds(parsedData);
      setResult(calcResult);
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  }, [inputData, tableType]);

  // Generate and download PDF
  const handleExportPDF = useCallback(async () => {
    if (!result || !chartsRef.current) return;

    setIsGeneratingPDF(true);
    try {
      // Get chart images
      const chartImages = await chartsRef.current.getChartImages();

      // Generate PDF
      const blob = await generatePDF(
        sessionDetails,
        result,
        inputData,
        tableType,
        chartImages
      );

      // Download
      const filename = `Report_${sessionDetails.athleteName || 'Athlete'}_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(blob, filename);
    } catch (e) {
      console.error('PDF generation error:', e);
      alert('Error generating PDF: ' + (e as Error).message);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [result, sessionDetails, inputData, tableType]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <header className="text-center mb-8">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:items-start sm:text-left max-w-4xl mx-auto w-full">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Canoe Slalom Lactate Threshold Calculator
              </h1>
              <p className="mt-2 text-lg text-gray-400">
                Analyze step test data to determine LT1 and LT2 thresholds.
              </p>
              {viewerMode && (
                <p className="mt-2 text-sm text-sky-400/95">
                  Signed in as viewer — library and athlete labels are de-identified; editing and saving are disabled.
                </p>
              )}
            </div>
            {isFirebaseConfigured() && (
              <button
                type="button"
                onClick={() => void signOutApp()}
                className="shrink-0 rounded-lg border border-slate-500/60 bg-slate-800/80 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/60"
              >
                Sign out
              </button>
            )}
          </div>
          <div className="mt-6 flex justify-center">
            <div className="inline-flex rounded-xl bg-gray-800 p-1 border border-gray-700 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveView('calculator')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeView === 'calculator'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Calculator & report
              </button>
              <button
                type="button"
                onClick={() => setActiveView('compare')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeView === 'compare'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Compare sessions
              </button>
            </div>
          </div>
        </header>

        {activeView === 'compare' ? (
          <ComparisonView showToast={pushToast} />
        ) : (
          <>
        <SessionLibraryPanel
          sessionDetails={sessionDetails}
          tableType={tableType}
          inputData={inputData}
          result={result}
          loadedSessionId={loadedSessionId}
          onClearSessionId={() => setLoadedSessionId(null)}
          onLoadSession={handleLoadSavedSession}
          showToast={pushToast}
          viewerMode={viewerMode}
        />

        <SessionDetails details={sessionDetails} onChange={setSessionDetails} readOnly={viewerMode} />

        <DataInputTable
          tableType={tableType}
          onTableTypeChange={handleTableTypeChange}
          data={inputData}
          onDataChange={setInputData}
          readOnly={viewerMode}
        />

        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={handleCalculate}
              className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Calculate Thresholds & Efficiency
            </button>
            {result && (
              <button
                onClick={handleExportPDF}
                disabled={isGeneratingPDF}
                className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? 'Generating PDF...' : 'Export PDF'}
              </button>
            )}
          </div>
          {error && (
            <div className="mt-4 text-red-400 font-medium">
              Error: {error}
            </div>
          )}
        </div>

        {result && (
          <>
            <Charts ref={chartsRef} result={result} darkMode={true} />
            <Results thresholds={result.displayThresholds} fixedPoints={result.fixedLactatePoints} />
            <TrainingZones zones={result.trainingZones} />
            {result.efficiencyData && <EfficiencyTable data={result.efficiencyData} />}
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
