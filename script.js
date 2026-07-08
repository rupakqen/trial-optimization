import { GeoDrawManager } from './utils/geo.js';
import { MetricsChartEngine } from './utils/charts.js';
import { compileStrategicReport } from './utils/pdf.js';
import { runStochasticOptimization } from './engine/optimizer.js';

// Setup Context Registries
let mapInstance = null;
let geoManager = null;
const chartEngine = new MetricsChartEngine();

let pdfPayloadCache = null;
let rawMetricsCache = null;

// =========================================================================
// SAFE INITIALIZATION ROUTINE (Fires only when DOM is fully sized)
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    try {
        // 1. Mount Leaflet instance to layout container
        mapInstance = L.map('map', { 
            preferCanvas: true,
            trackResize: true 
        }).setView([24.15, -95.30], 7);

        // 2. Load dark map styling matrix
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO',
            crossOrigin: 'anonymous'
        }).addTo(mapInstance);
        
        // 3. Force rendering layout recalculation cycle to guarantee tile load
        setTimeout(() => { 
            mapInstance.invalidateSize(); 
            console.log("✔ Map rendering layout verified and sized.");
        }, 200);

        // 4. Initialize the drawing tool now that the map context is active
        geoManager = new GeoDrawManager(mapInstance, 'btn-draw-mode', 'bbox-min', 'bbox-max');
        geoManager.init();

        // 5. Populate standard reference windows
        setupDefaultReferenceTensors();

    } catch (e) { 
        console.error("Critical failure during map viewport generation phase:", e); 
    }
});

// =========================================================================
// AUTO-FILL OPERATIONAL REFERENCE TIMELINES & BOUNDS
// =========================================================================
function setupDefaultReferenceTensors() {
    const minInput = document.getElementById('bbox-min');
    const maxInput = document.getElementById('bbox-max');
    const timeStartInput = document.getElementById('time-start');
    const timeEndInput = document.getElementById('time-end');

    if (minInput && !minInput.value) minInput.value = "24.0866, -95.3790";
    if (maxInput && !maxInput.value) maxInput.value = "24.2870, -95.2692";
    
    if (timeStartInput && !timeStartInput.value) timeStartInput.value = "2026-07-14T00:00";
    if (timeEndInput && !timeEndInput.value) timeEndInput.value = "2026-07-14T23:00";
}

// =========================================================================
// DISPATCHER EXECUTION MATRIX
// =========================================================================
document.getElementById('btn-optimize').addEventListener('click', () => {
    const rawMin = document.getElementById('bbox-min').value;
    const rawMax = document.getElementById('bbox-max').value;
    const tStartStr = document.getElementById('time-start').value;
    const tEndStr = document.getElementById('time-end').value;

    if (!rawMin || !rawMax || !tStartStr || !tEndStr) {
        alert("❌ CRITICAL ERROR: Incomplete Tasking Profiles.");
        return; 
    }

    const minInput = rawMin.split(',');
    const maxInput = rawMax.split(',');
    const minLat = parseFloat(minInput[0].trim()), minLon = parseFloat(minInput[1].trim());
    const maxLat = parseFloat(maxInput[0].trim()), maxLon = parseFloat(maxInput[1].trim());

    if (isNaN(minLat) || isNaN(minLon) || isNaN(maxLat) || isNaN(maxLon)) {
        alert("❌ PARSING ERROR: Extent dimensions contain invalid characters.");
        return;
    }

    // Process evaluation metrics loops via calculation module
    const metrics = runStochasticOptimization(minLat, minLon, maxLat, maxLon, tStartStr, tEndStr);

    // Make output containers visible
    document.getElementById('briefing-panel').classList.remove('hidden');
    document.getElementById('btn-download-pdf').classList.remove('hidden');

    // Update individual Cost Fields
    document.getElementById('cost-planet').innerText = `$${metrics.summary.costP.toLocaleString()}`;
    document.getElementById('prob-planet').innerText = `P(Pass Success): ${metrics.summary.pP}%`;

    document.getElementById('cost-capella').innerText = `$${metrics.summary.costC.toLocaleString()}`;
    document.getElementById('prob-capella').innerText = `P(Pass Success): ${metrics.summary.pC}%`;

    document.getElementById('cost-iceye').innerText = `$${metrics.summary.costI.toLocaleString()}`;
    document.getElementById('prob-iceye').innerText = `P(Pass Success): ${metrics.summary.pI}%`;

    // Rebuild graphical interfaces
    try {
        chartEngine.buildPrimaryTimeline(
            document.getElementById('cloudChart').getContext('2d'), 
            metrics.labels, 
            metrics.clouds, 
            metrics.solarArr, 
            metrics.qP, 
            metrics.pP, 
            metrics.pC, 
            metrics.pI
        );

        chartEngine.buildGanttTimeline(
            document.getElementById('ganttChart').getContext('2d'), 
            metrics.labels, 
            metrics.gantt
        );
    } catch (chartErr) {
        console.error("Rendering breakdown inside chart processing engine:", chartErr);
    }

    // Inject narrative text memo block
    document.getElementById('briefing-text').innerText = metrics.summary.textMemo;

    // Save calculation contexts for direct download processing hooks
    pdfPayloadCache = metrics.summary;
    rawMetricsCache = metrics;
});

document.getElementById('btn-download-pdf').addEventListener('click', async () => {
    if (!pdfPayloadCache || !rawMetricsCache) return;
    const targetBtn = document.getElementById('btn-download-pdf');
    targetBtn.innerText = "⚡ COMPILING NAVY EXSUM..."; targetBtn.disabled = true;
    await compileStrategicReport(pdfPayloadCache, rawMetricsCache);
    targetBtn.innerText = "💾 Export PDF Briefing"; targetBtn.disabled = false;
});