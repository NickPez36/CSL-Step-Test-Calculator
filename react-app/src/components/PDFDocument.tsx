import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import type { SessionDetails, CalculationResult, StepData, TableType } from '../types';
import { TABLE_CONFIGS } from '../types';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 25,
        fontFamily: 'Helvetica',
        fontSize: 9,
        backgroundColor: '#ffffff',
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
        color: '#111827',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 6,
        marginTop: 10,
        color: '#374151',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 3,
    },
    metaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    metaItem: {
        width: '50%',
        marginBottom: 4,
    },
    metaLabel: {
        fontSize: 8,
        color: '#6b7280',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    metaValue: {
        fontSize: 10,
        color: '#111827',
    },
    table: {
        marginBottom: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
    },
    tableHeader: {
        backgroundColor: '#f3f4f6',
        fontWeight: 'bold',
    },
    tableCell: {
        padding: 4,
        textAlign: 'center',
        flex: 1,
        fontSize: 8,
    },
    thresholdBox: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 4,
        padding: 10,
        marginBottom: 10,
    },
    thresholdTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    thresholdGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    thresholdItem: {
        textAlign: 'center',
    },
    thresholdLabel: {
        fontSize: 8,
        color: '#6b7280',
    },
    thresholdValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    chartContainer: {
        marginBottom: 6,
        alignItems: 'center',
    },
    chartImage: {
        width: 220,
        height: 140,
    },
    chartsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    chartWrapper: {
        width: '48%',
        marginBottom: 5,
    },
    chartTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 3,
        color: '#374151',
    },
    zonesTable: {
        marginBottom: 15,
        fontSize: 7,
    },
    zoneRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
    },
    zoneCell: {
        padding: 3,
        textAlign: 'center',
    },
    zoneHeader: {
        backgroundColor: '#374151',
        color: '#ffffff',
    },
    zoneDomain: {
        width: 50,
        fontWeight: 'bold',
        backgroundColor: '#ffffff',
        color: '#111827',
    },
    zoneZone: { width: 25 },
    zoneDescriptor: { width: 80, textAlign: 'left' },
    zoneHr: { width: 55 },
    zoneSpeed: { width: 55 },
    zoneVo2: { width: 40 },
    zoneRpe: { width: 90 },
    zoneDuration: { width: 50 },
    efficiencyRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 4,
    },
    efficiencyCell: {
        textAlign: 'center',
    },
    efficiencyStep: { width: 40 },
    efficiencyScore: { width: 80 },
    efficiencyChange: { width: 60 },
    efficiencyBar: { flex: 1 },
});

interface PDFDocumentProps {
    sessionDetails: SessionDetails;
    result: CalculationResult;
    inputData: StepData[];
    tableType: TableType;
    chartImages: {
        lactate: string;
        hr: string;
        sr: string;
        efficiency: string;
    };
}

const PDFDocument = ({ sessionDetails, result, inputData, tableType, chartImages }: PDFDocumentProps) => {
    const config = TABLE_CONFIGS[tableType];
    const zones = result.trainingZones;

    // Calculate zone values
    const r_max = Math.round(zones.maxHr);
    const r_lt1 = Math.round(zones.lt1Hr);
    const r_lt2 = Math.round(zones.lt2Hr);
    const r_hr_midpoint = Math.round(zones.lt1Hr + (zones.lt2Hr - zones.lt1Hr) / 2);
    const s_lt1 = zones.lt1Speed;
    const s_lt2 = zones.lt2Speed;
    const s_midpoint = s_lt1 + (s_lt2 - s_lt1) / 2;
    const s_75max = zones.maxSpeed * 0.75;

    return (
        <Document>
            {/* Page 1: Metadata, Input Data, Charts */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.header}>Canoe Slalom Lactate Threshold Report</Text>

                {/* Metadata */}
                <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Athlete Name</Text>
                        <Text style={styles.metaValue}>{sessionDetails.athleteName || '-'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Date</Text>
                        <Text style={styles.metaValue}>
                            {sessionDetails.testDate ? new Date(sessionDetails.testDate).toLocaleDateString() : '-'}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Boat Class</Text>
                        <Text style={styles.metaValue}>{sessionDetails.boatClass}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Protocol</Text>
                        <Text style={styles.metaValue}>{sessionDetails.protocol || '-'}</Text>
                    </View>
                </View>
                {sessionDetails.comments && (
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Comments</Text>
                        <Text style={styles.metaValue}>{sessionDetails.comments}</Text>
                    </View>
                )}

                {/* Input Data Table */}
                <Text style={styles.sectionTitle}>Step Test Data</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        {config.headers.map((header, i) => (
                            <Text key={i} style={styles.tableCell}>{header}</Text>
                        ))}
                    </View>
                    {inputData.map((row, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.tableCell}>{row.step}</Text>
                            <Text style={styles.tableCell}>{i === inputData.length - 1 ? 'Max' : (row.hrPlanned || '-')}</Text>
                            <Text style={styles.tableCell}>{row.hrAchieved || '-'}</Text>
                            <Text style={styles.tableCell}>{row.speed || '-'}</Text>
                            <Text style={styles.tableCell}>{row.lactate || '-'}</Text>
                            <Text style={styles.tableCell}>{row.strokeRate || '-'}</Text>
                        </View>
                    ))}
                </View>

                {/* Charts */}
                <Text style={styles.sectionTitle}>Performance Visualizations</Text>
                <View style={styles.chartsGrid}>
                    <View style={styles.chartWrapper}>
                        <Text style={styles.chartTitle}>Speed vs Lactate</Text>
                        {chartImages.lactate && <Image style={styles.chartImage} src={chartImages.lactate} />}
                    </View>
                    <View style={styles.chartWrapper}>
                        <Text style={styles.chartTitle}>Speed vs Heart Rate</Text>
                        {chartImages.hr && <Image style={styles.chartImage} src={chartImages.hr} />}
                    </View>
                    <View style={styles.chartWrapper}>
                        <Text style={styles.chartTitle}>Speed vs Stroke Rate</Text>
                        {chartImages.sr && <Image style={styles.chartImage} src={chartImages.sr} />}
                    </View>
                    <View style={styles.chartWrapper}>
                        <Text style={styles.chartTitle}>Step Efficiency</Text>
                        {chartImages.efficiency && <Image style={styles.chartImage} src={chartImages.efficiency} />}
                    </View>
                </View>
            </Page>

            {/* Page 2: Thresholds, Lactate Points, Training Zones */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.sectionTitle}>Thresholds & Training Zones</Text>

                {/* Thresholds */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                    <View style={[styles.thresholdBox, { flex: 1, borderColor: '#14b8a6' }]}>
                        <Text style={[styles.thresholdTitle, { color: '#0d9488' }]}>Lactate Threshold 1 (LT1)</Text>
                        <View style={styles.thresholdGrid}>
                            <View style={styles.thresholdItem}>
                                <Text style={styles.thresholdLabel}>HR</Text>
                                <Text style={styles.thresholdValue}>{result.displayThresholds.lt1.hr}</Text>
                            </View>
                            <View style={styles.thresholdItem}>
                                <Text style={styles.thresholdLabel}>Speed</Text>
                                <Text style={styles.thresholdValue}>{result.displayThresholds.lt1.speed}</Text>
                            </View>
                            <View style={styles.thresholdItem}>
                                <Text style={styles.thresholdLabel}>Lactate</Text>
                                <Text style={styles.thresholdValue}>{result.displayThresholds.lt1.lactate}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.thresholdBox, { flex: 1, borderColor: '#ef4444' }]}>
                        <Text style={[styles.thresholdTitle, { color: '#dc2626' }]}>Lactate Threshold 2 (LT2)</Text>
                        <View style={styles.thresholdGrid}>
                            <View style={styles.thresholdItem}>
                                <Text style={styles.thresholdLabel}>HR</Text>
                                <Text style={styles.thresholdValue}>{result.displayThresholds.lt2.hr}</Text>
                            </View>
                            <View style={styles.thresholdItem}>
                                <Text style={styles.thresholdLabel}>Speed</Text>
                                <Text style={styles.thresholdValue}>{result.displayThresholds.lt2.speed}</Text>
                            </View>
                            <View style={styles.thresholdItem}>
                                <Text style={styles.thresholdLabel}>Lactate</Text>
                                <Text style={styles.thresholdValue}>{result.displayThresholds.lt2.lactate}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Key Lactate Points */}
                <View style={[styles.thresholdBox, { marginBottom: 15 }]}>
                    <Text style={styles.thresholdTitle}>Key Lactate Points</Text>
                    <View style={styles.thresholdGrid}>
                        {[2, 4, 6].map((mmol) => (
                            <View key={mmol} style={styles.thresholdItem}>
                                <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{mmol}.0 mmol/L</Text>
                                <Text style={styles.thresholdLabel}>HR: {result.fixedLactatePoints[mmol]?.hr || '-'}</Text>
                                <Text style={styles.thresholdLabel}>Speed: {result.fixedLactatePoints[mmol]?.speed || '-'}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Training Zones Table */}
                <Text style={styles.sectionTitle}>Training Zones</Text>
                <View style={styles.zonesTable}>
                    {/* Header */}
                    <View style={[styles.zoneRow, styles.zoneHeader]}>
                        <Text style={[styles.zoneCell, styles.zoneDomain, { backgroundColor: '#374151', color: '#fff' }]}>Domain</Text>
                        <Text style={[styles.zoneCell, styles.zoneZone]}>Zone</Text>
                        <Text style={[styles.zoneCell, styles.zoneDescriptor]}>Descriptor</Text>
                        <Text style={[styles.zoneCell, styles.zoneHr]}>HR (BPM)</Text>
                        <Text style={[styles.zoneCell, styles.zoneSpeed]}>Speed (m/s)</Text>
                        <Text style={[styles.zoneCell, styles.zoneVo2]}>% VO2max</Text>
                        <Text style={[styles.zoneCell, styles.zoneRpe]}>RPE</Text>
                        <Text style={[styles.zoneCell, styles.zoneDuration]}>Duration</Text>
                    </View>

                    {/* MODERATE Domain Group (T1, T2) */}
                    <View style={{ flexDirection: 'row' }}>
                        <View style={[styles.zoneDomain, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#84cc16', borderRightWidth: 1, borderRightColor: '#d1d5db' }]}>
                            <Text style={{ fontWeight: 'bold', fontSize: 7, color: '#000' }}>MODERATE</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={[styles.zoneRow, { backgroundColor: '#84cc16' }]}>
                                <Text style={[styles.zoneCell, styles.zoneZone]}>T1</Text>
                                <Text style={[styles.zoneCell, styles.zoneDescriptor]}>Light Aerobic</Text>
                                <Text style={[styles.zoneCell, styles.zoneHr]}>&lt; {Math.round(r_max * 0.7)}</Text>
                                <Text style={[styles.zoneCell, styles.zoneSpeed]}>&lt; {s_75max.toFixed(2)}</Text>
                                <Text style={[styles.zoneCell, styles.zoneVo2]}>50-60</Text>
                                <Text style={[styles.zoneCell, styles.zoneRpe]}>(1-2) [7-11]</Text>
                                <Text style={[styles.zoneCell, styles.zoneDuration]}>1-6h</Text>
                            </View>
                            <View style={[styles.zoneRow, { backgroundColor: '#a3e635' }]}>
                                <Text style={[styles.zoneCell, styles.zoneZone]}>T2</Text>
                                <Text style={[styles.zoneCell, styles.zoneDescriptor]}>Moderate Aerobic</Text>
                                <Text style={[styles.zoneCell, styles.zoneHr]}>{Math.round(r_max * 0.7)}-{r_lt1}</Text>
                                <Text style={[styles.zoneCell, styles.zoneSpeed]}>{s_75max.toFixed(2)}-{s_lt1.toFixed(2)}</Text>
                                <Text style={[styles.zoneCell, styles.zoneVo2]}>60-75</Text>
                                <Text style={[styles.zoneCell, styles.zoneRpe]}>(2-4) [11-13]</Text>
                                <Text style={[styles.zoneCell, styles.zoneDuration]}>1-3h</Text>
                            </View>
                        </View>
                    </View>

                    {/* MT1 threshold marker */}
                    <View style={[styles.zoneRow, { backgroundColor: '#4b5563' }]}>
                        <Text style={{ padding: 3, textAlign: 'center', color: '#fff', fontSize: 7, fontWeight: 'bold', width: '100%' }}>
                            1ST METABOLIC THRESHOLD MT1/LT1
                        </Text>
                    </View>

                    {/* HEAVY Domain Group (T3, T4) */}
                    <View style={{ flexDirection: 'row' }}>
                        <View style={[styles.zoneDomain, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#facc15', borderRightWidth: 1, borderRightColor: '#d1d5db' }]}>
                            <Text style={{ fontWeight: 'bold', fontSize: 7, color: '#000' }}>HEAVY</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={[styles.zoneRow, { backgroundColor: '#facc15' }]}>
                                <Text style={[styles.zoneCell, styles.zoneZone]}>T3</Text>
                                <Text style={[styles.zoneCell, styles.zoneDescriptor]}>Heavy Aerobic</Text>
                                <Text style={[styles.zoneCell, styles.zoneHr]}>{r_lt1}-{r_hr_midpoint}</Text>
                                <Text style={[styles.zoneCell, styles.zoneSpeed]}>{s_lt1.toFixed(2)}-{s_midpoint.toFixed(2)}</Text>
                                <Text style={[styles.zoneCell, styles.zoneVo2]}>70-85</Text>
                                <Text style={[styles.zoneCell, styles.zoneRpe]}>(4-5) [13-15]</Text>
                                <Text style={[styles.zoneCell, styles.zoneDuration]}>45-90m</Text>
                            </View>
                            <View style={[styles.zoneRow, { backgroundColor: '#fb923c' }]}>
                                <Text style={[styles.zoneCell, styles.zoneZone]}>T4</Text>
                                <Text style={[styles.zoneCell, styles.zoneDescriptor]}>Threshold</Text>
                                <Text style={[styles.zoneCell, styles.zoneHr]}>{r_hr_midpoint}-{r_lt2}</Text>
                                <Text style={[styles.zoneCell, styles.zoneSpeed]}>{s_midpoint.toFixed(2)}-{s_lt2.toFixed(2)}</Text>
                                <Text style={[styles.zoneCell, styles.zoneVo2]}>80-90</Text>
                                <Text style={[styles.zoneCell, styles.zoneRpe]}>(5-7) [15-17]</Text>
                                <Text style={[styles.zoneCell, styles.zoneDuration]}>30-60m</Text>
                            </View>
                        </View>
                    </View>

                    {/* MT2 threshold marker */}
                    <View style={[styles.zoneRow, { backgroundColor: '#4b5563' }]}>
                        <Text style={{ padding: 3, textAlign: 'center', color: '#fff', fontSize: 7, fontWeight: 'bold', width: '100%' }}>
                            2ND METABOLIC THRESHOLD MT2/LT2
                        </Text>
                    </View>

                    {/* SEVERE Domain (T5 only) */}
                    <View style={{ flexDirection: 'row' }}>
                        <View style={[styles.zoneDomain, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ea580c', borderRightWidth: 1, borderRightColor: '#d1d5db' }]}>
                            <Text style={{ fontWeight: 'bold', fontSize: 7, color: '#fff' }}>SEVERE</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={[styles.zoneRow, { backgroundColor: '#ea580c' }]}>
                                <Text style={[styles.zoneCell, styles.zoneZone, { color: '#fff' }]}>T5</Text>
                                <Text style={[styles.zoneCell, styles.zoneDescriptor, { color: '#fff' }]}>Maximal Aerobic</Text>
                                <Text style={[styles.zoneCell, styles.zoneHr, { color: '#fff' }]}>&gt; {r_lt2}</Text>
                                <Text style={[styles.zoneCell, styles.zoneSpeed, { color: '#fff' }]}>&gt; {s_lt2.toFixed(2)}</Text>
                                <Text style={[styles.zoneCell, styles.zoneVo2, { color: '#fff' }]}>90-100</Text>
                                <Text style={[styles.zoneCell, styles.zoneRpe, { color: '#fff' }]}>(7-10) [17-20]</Text>
                                <Text style={[styles.zoneCell, styles.zoneDuration, { color: '#fff' }]}>12-30m</Text>
                            </View>
                        </View>
                    </View>

                    {/* EXTREME Domain Group (T6, T7, T8) */}
                    <View style={{ flexDirection: 'row' }}>
                        <View style={[styles.zoneDomain, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#991b1b', borderRightWidth: 1, borderRightColor: '#d1d5db' }]}>
                            <Text style={{ fontWeight: 'bold', fontSize: 7, color: '#fff' }}>EXTREME</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={[styles.zoneRow, { backgroundColor: '#dc2626' }]}>
                                <Text style={[styles.zoneCell, styles.zoneZone, { color: '#fff' }]}>T6</Text>
                                <Text style={[styles.zoneCell, styles.zoneDescriptor, { color: '#fff' }]}>Power Tolerance</Text>
                                <Text style={[styles.zoneCell, styles.zoneHr, { color: '#fff' }]}>N/A</Text>
                                <Text style={[styles.zoneCell, styles.zoneSpeed, { color: '#fff' }]}>N/A</Text>
                                <Text style={[styles.zoneCell, styles.zoneVo2, { color: '#fff' }]}>N/A</Text>
                                <Text style={[styles.zoneCell, styles.zoneRpe, { color: '#fff' }]}>(10) [20]</Text>
                                <Text style={[styles.zoneCell, styles.zoneDuration, { color: '#fff' }]}>4-12m</Text>
                            </View>
                            <View style={[styles.zoneRow, { backgroundColor: '#991b1b' }]}>
                                <Text style={[styles.zoneCell, styles.zoneZone, { color: '#fff' }]}>T7</Text>
                                <Text style={[styles.zoneCell, styles.zoneDescriptor, { color: '#fff' }]}>Power Production</Text>
                                <Text style={[styles.zoneCell, styles.zoneHr, { color: '#fff' }]}>N/A</Text>
                                <Text style={[styles.zoneCell, styles.zoneSpeed, { color: '#fff' }]}>N/A</Text>
                                <Text style={[styles.zoneCell, styles.zoneVo2, { color: '#fff' }]}>N/A</Text>
                                <Text style={[styles.zoneCell, styles.zoneRpe, { color: '#fff' }]}>(10) [20]</Text>
                                <Text style={[styles.zoneCell, styles.zoneDuration, { color: '#fff' }]}>2-6m</Text>
                            </View>
                            <View style={[styles.zoneRow, { backgroundColor: '#7f1d1d' }]}>
                                <Text style={[styles.zoneCell, styles.zoneZone, { color: '#fff' }]}>T8</Text>
                                <Text style={[styles.zoneCell, styles.zoneDescriptor, { color: '#fff' }]}>Neuro-muscular</Text>
                                <Text style={[styles.zoneCell, styles.zoneHr, { color: '#fff' }]}>N/A</Text>
                                <Text style={[styles.zoneCell, styles.zoneSpeed, { color: '#fff' }]}>N/A</Text>
                                <Text style={[styles.zoneCell, styles.zoneVo2, { color: '#fff' }]}>N/A</Text>
                                <Text style={[styles.zoneCell, styles.zoneRpe, { color: '#fff' }]}>(10) [20]</Text>
                                <Text style={[styles.zoneCell, styles.zoneDuration, { color: '#fff' }]}>10s-2m</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Step Efficiency Analysis - on same page as Training Zones */}
                {result.efficiencyData && (
                    <View style={{ marginTop: 10 }}>
                        <Text style={styles.sectionTitle}>Step Efficiency Analysis</Text>
                        <Text style={{ fontSize: 7, color: '#6b7280', marginBottom: 6 }}>
                            Calculated as (velocity³) / (stroke rate / 60)
                        </Text>

                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <Text style={[styles.tableCell, { width: 40 }]}>Step</Text>
                                <Text style={[styles.tableCell, { width: 80 }]}>Efficiency</Text>
                                <Text style={[styles.tableCell, { width: 60 }]}>% Change</Text>
                                <Text style={[styles.tableCell, { flex: 1 }]}>Comparison to Step 1</Text>
                            </View>
                            {result.efficiencyData.map((item) => {
                                const percentChange = item.percentChange || 0;
                                const displayChange = percentChange.toFixed(1);
                                const barWidth = Math.min(100, Math.abs(percentChange) * 3);
                                const barColor = percentChange >= 0 ? '#059669' : '#dc2626';

                                return (
                                    <View key={item.step} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, { width: 40 }]}>{item.step}</Text>
                                        <Text style={[styles.tableCell, { width: 80 }]}>{item.efficiency.toFixed(3)}</Text>
                                        <Text style={[styles.tableCell, { width: 60, color: percentChange > 0 ? '#059669' : percentChange < 0 ? '#dc2626' : '#111827', fontWeight: 'bold' }]}>
                                            {percentChange >= 0 ? '+' : ''}{displayChange}%
                                        </Text>
                                        <View style={[styles.tableCell, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
                                            {item.step === 1 ? (
                                                <Text style={{ fontSize: 7, color: '#6b7280' }}>Baseline</Text>
                                            ) : (
                                                <View style={{ width: '80%', height: 8, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                                                    <View style={{
                                                        width: `${barWidth}%`,
                                                        height: '100%',
                                                        backgroundColor: barColor,
                                                        borderRadius: 2,
                                                    }} />
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
            </Page>
        </Document>
    );
};

// Export function to generate PDF blob
export async function generatePDF(
    sessionDetails: SessionDetails,
    result: CalculationResult,
    inputData: StepData[],
    tableType: TableType,
    chartImages: { lactate: string; hr: string; sr: string; efficiency: string }
): Promise<Blob> {
    const doc = (
        <PDFDocument
            sessionDetails={sessionDetails}
            result={result}
            inputData={inputData}
            tableType={tableType}
            chartImages={chartImages}
        />
    );

    const blob = await pdf(doc).toBlob();
    return blob;
}

// Download helper
export function downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
