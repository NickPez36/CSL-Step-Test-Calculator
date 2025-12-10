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
} from './components';
import type { ChartsRef } from './components';
import { calculateThresholds, parseTableData } from './services/calculations';
import type { SessionDetails as SessionDetailsType, StepData, TableType, CalculationResult } from './types';

function App() {
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
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Canoe Slalom Lactate Threshold Calculator
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Analyze step test data to determine LT1 and LT2 thresholds.
          </p>
        </header>

        <SessionDetails details={sessionDetails} onChange={setSessionDetails} />

        <DataInputTable
          tableType={tableType}
          onTableTypeChange={handleTableTypeChange}
          data={inputData}
          onDataChange={setInputData}
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
      </div>
    </div>
  );
}

export default App;
