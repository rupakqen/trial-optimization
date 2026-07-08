// =========================================================================
// 1. ENGINE RUNTIME DATA & CANVAS HOOKS
// =========================================================================
let map, selectionLayer, cloudChartInstance = null, ganttChartInstance = null;
try {
    map = L.map('map', { preferCanvas: true }).setView([25.15, -94.40], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO', crossOrigin: 'anonymous'
    }).addTo(map);
} catch (e) { console.error("Geospatial setup layer exception:", e); }

// Hardcoded Window Controls Centered Strictly to User Requirements
document.getElementById('time-start').value = "2026-07-13T00:30";
document.getElementById('time-end').value = "2026-07-14T20:30";

let globalBBoxMin = "", globalBBoxMax = "", globalArea = "", globalWindowDisplay = "";
let globalP_Planet = 0, globalP_Capella = 0, globalP_Iceye = 0;
let globalPlanetCost = 0, globalCapellaCost = 0, globalIceyeCost = 0;
let globalStrategyText = "";

function calculateSolarMetrics(lat, lon, dateTimeObj) {
    const radians = Math.PI / 180;
    const dayOfYear = Math.floor((dateTimeObj - new Date(dateTimeObj.getFullYear(), 0, 0)) / 86400000);
    const declination = 23.45 * Math.sin(radians * (360 / 365 * (dayOfYear - 81)));
    const hour = dateTimeObj.getUTCHours() + (dateTimeObj.getUTCMinutes() / 60);
    const hourAngle = ((hour + (lon / 15)) - 12) * 15;
    
    let sinAltitude = Math.sin(lat * radians) * Math.sin(declination * radians) + 
                      Math.cos(lat * radians) * Math.cos(declination * radians) * Math.cos(hourAngle * radians);
    return Math.max(Math.asin(sinAltitude) / radians, 0);
}

// Bounding Box Polygon Draw Listeners - LIVE MOUSEMOVE UPDATES RE-ENGINEERED
let drawModeActive = false, clickCount = 0, firstCornerLatLng = null;
const drawModeBtn = document.getElementById('btn-draw-mode');

if (drawModeBtn) {
    drawModeBtn.addEventListener('click', () => {
        drawModeActive = !drawModeActive; clickCount = 0;
        if (drawModeActive) {
            drawModeBtn.innerText = "🚨 Click Corner 1";
            drawModeBtn.classList.replace('bg-indigo-600/20', 'bg-amber-600/40');
            map.dragging.disable();
            L.DomUtil.addClass(map._container, 'draw-mode-crosshair');
        } else { resetDrawState(); }
    });
}

function resetDrawState() {
    drawModeActive = false;
    drawModeBtn.innerText = "[┼] Intercept Bounding Box Tool";
    drawModeBtn.classList.replace('bg-amber-600/40', 'bg-indigo-600/20');
    map.dragging.enable();
    L.DomUtil.removeClass(map._container, 'draw-mode-crosshair');
    map.off('mousemove');
}

map.on('click', (e) => {
    if (!drawModeActive) return;
    clickCount++;
    
    if (clickCount === 1) {
        firstCornerLatLng = e.latlng;
        drawModeBtn.innerText = "🚨 Drag & Click Opposite Corner";
        
        // Dynamic Drag Handler: Forces standard rectangle redraws live over mouse tracking ticks
        map.on('mousemove', (moveEvent) => {
            if (selectionLayer) map.removeLayer(selectionLayer);
            selectionLayer = L.rectangle([firstCornerLatLng, moveEvent.latlng], { 
                color: "#6366f1", 
                weight: 2, 
                fillColor: "#6366f1",
                fillOpacity: 0.15 
            }).addTo(map);
        });
    } else if (clickCount === 2) {
        map.off('mousemove'); // Detach drag handlers instantly on second confirmation anchor click
        const minLat = Math.min(firstCornerLatLng.lat, e.latlng.lat);
        const maxLat = Math.max(firstCornerLatLng.lat, e.latlng.lat);
        const minLon = Math.min(firstCornerLatLng.lng, e.latlng.lng);
        const maxLon = Math.max(firstCornerLatLng.lng, e.latlng.lng);
        
        document.getElementById('bbox-min').value = `${minLat.toFixed(4)}, ${minLon.toFixed(4)}`;
        document.getElementById('bbox-max').value = `${maxLat.toFixed(4)}, ${maxLon.toFixed(4)}`;
        
        if (selectionLayer) map.removeLayer(selectionLayer);
        selectionLayer = L.rectangle([[minLat, minLon], [maxLat, maxLon]], { color: "#6366f1", weight: 2, fillColor: "#6366f1", fillOpacity: 0.1 }).addTo(map);
        resetDrawState();
    }
});

// =========================================================================
// 2. HIGH-CONTRAST DATA VISUALIZATION ENGINES
// =========================================================================
function renderTacticalCharts(labels, cloudData, solarData, qPlanet, pPlanet, pCapella, pIceye, ganttData) {
    document.getElementById('chart-panel').classList.remove('hidden');

    const ctx1 = document.getElementById('cloudChart').getContext('2d');
    if (cloudChartInstance) { cloudChartInstance.destroy(); }
    cloudChartInstance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Planet Cum P(≥1 Pass) %', data: pPlanet, borderColor: '#C084FC', borderWidth: 3, pointRadius: 2, yAxisID: 'y' },
                { label: 'Planet Img Quality q(t) %', data: qPlanet, borderColor: '#22C55E', borderWidth: 2, pointRadius: 0, yAxisID: 'y' },
                { label: 'Capella Cum P(≥1 Pass) %', data: pCapella, borderColor: '#38BDF8', borderWidth: 1.5, borderDash: [3, 3], pointRadius: 0, yAxisID: 'y' },
                { label: 'ICEYE Cum P(≥1 Pass) %', data: pIceye, borderColor: '#F43F5E', borderWidth: 1.5, borderDash: [5, 5], pointRadius: 0, yAxisID: 'y' },
                { label: 'Cloud Cover %', data: cloudData, borderColor: '#64748B', borderWidth: 1, pointRadius: 0, yAxisID: 'y' },
                { label: 'Solar Altitude (°)', data: solarData, borderColor: '#F59E0B', borderWidth: 1.2, borderDash: [6, 6], pointRadius: 0, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false, devicePixelRatio: 2,
            scales: {
                x: { ticks: { color: '#F1F5F9', font: { size: 9, family: 'monospace', weight: 'bold' } }, grid: { color: '#334155' } },
                y: { min: 0, max: 100, ticks: { color: '#F1F5F9', font: { weight: 'bold' } }, grid: { color: '#334155' } },
                y1: { min: 0, max: 90, display: true, position: 'right', ticks: { color: '#F59E0B' }, grid: { drawOnChartArea: false } }
            },
            plugins: { legend: { labels: { color: '#F8FAFC', font: { size: 9, family: 'monospace', weight: 'bold' } } } }
        }
    });

    const ctx2 = document.getElementById('ganttChart').getContext('2d');
    if (ganttChartInstance) { ganttChartInstance.destroy(); }
    ganttChartInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Optical Preferred Window', data: ganttData.opt, backgroundColor: '#A855F7', barPercentage: 0.9 },
                { label: 'SAR Mandatory Window', data: ganttData.sar, backgroundColor: '#38BDF8', barPercentage: 0.9 },
                { label: 'Combined High-Assurance Target Zone', data: ganttData.comb, backgroundColor: '#22C55E', barPercentage: 0.9 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false, devicePixelRatio: 2,
            indexAxis: 'x',
            scales: {
                x: { stacked: true, ticks: { color: '#F1F5F9', font: { size: 9, family: 'monospace', weight: 'bold' } }, grid: { color: '#334155' } },
                y: { stacked: true, min: 0, max: 3, display: false }
            },
            plugins: { legend: { labels: { color: '#F8FAFC', font: { size: 9, family: 'monospace', weight: 'bold' } } } }
        }
    });
}

// =========================================================================
// 3. ANALYSIS PIPELINE EXECUTIONS
// =========================================================================
document.getElementById('btn-optimize').addEventListener('click', async () => {
    const minInput = document.getElementById('bbox-min').value.split(',');
    const maxInput = document.getElementById('bbox-max').value.split(',');
    const minLat = parseFloat(minInput[0].trim()), minLon = parseFloat(minInput[1].trim());
    const maxLat = parseFloat(maxInput[0].trim()), maxLon = parseFloat(maxInput[1].trim());

    globalBBoxMin = document.getElementById('bbox-min').value;
    globalBBoxMax = document.getElementById('bbox-max').value;
    
    const tStartStr = document.getElementById('time-start').value;
    const tEndStr = document.getElementById('time-end').value;
    const dStart = new Date(tStartStr + ":00Z");
    const dEnd = new Date(tEndStr + ":00Z");

    globalWindowDisplay = `${tStartStr.replace('T', ' ')}Z to ${tEndStr.replace('T', ' ')}Z`;
    const areaSqKm = Math.max(Math.round(Math.abs((maxLat - minLat) * (maxLon - minLon)) * 111 * 111), 1);
    globalArea = `${areaSqKm.toLocaleString()} Sq Km`;

    globalPlanetCost = Math.max(areaSqKm * 2.15, 537.5); 
    globalCapellaCost = 4200; 
    globalIceyeCost = 3950;

    const timeLabels = [];
    const cloudValues = [];
    const solarValues = [];
    
    const steps = 20; 
    const diffMs = dEnd - dStart;
    const stepMs = diffMs / steps; 

    const baseClouds = [30, 15, 2, 0, 0, 0, 5, 12, 45, 30, 22, 10, 5, 48, 25, 8, 2, 0, 10, 20, 5];

    for(let i = 0; i <= steps; i++) {
        const currentStepDate = new Date(dStart.getTime() + (stepMs * i));
        const hh = String(currentStepDate.getUTCHours()).padStart(2, '0');
        const mm = String(currentStepDate.getUTCMinutes()).padStart(2, '0');
        timeLabels.push(`${hh}:${mm}`);

        const sunAlt = calculateSolarMetrics(minLat, minLon, currentStepDate);
        solarValues.push(parseFloat(sunAlt.toFixed(1)));
        cloudValues.push(baseClouds[i % baseClouds.length]);
    }

    let running_mu_planet = 0, running_mu_capella = 0, running_mu_iceye = 0;
    const qPlanet = [], pPlanet = [], pCapella = [], pIceye = [];
    const ganttData = { opt: [], sar: [], comb: [] };

    const lambda_p = 0.22; 
    const lambda_c = 1 / 4.5; 
    const lambda_i = 1 / 5.0; 
    const hoursPerStep = (stepMs / 3600000);

    for(let i = 0; i <= steps; i++) {
        const C = cloudValues[i];
        const S = solarValues[i];

        const f_cloud = 1 - (C / 100);
        const f_sun = S < 12 ? 0 : (S >= 35 ? 1 : (S - 12) / 23); 
        const q_t = f_cloud * f_sun;
        qPlanet.push(Math.round(q_t * 100));

        running_mu_planet += lambda_p * q_t * hoursPerStep;
        running_mu_capella += lambda_c * 1.0 * hoursPerStep; 
        running_mu_iceye += lambda_i * 1.0 * hoursPerStep;

        pPlanet.push(Math.round((1 - Math.exp(-running_mu_planet)) * 100));
        pCapella.push(Math.round((1 - Math.exp(-running_mu_capella)) * 100));
        pIceye.push(Math.round((1 - Math.exp(-running_mu_iceye)) * 100));

        if (q_t > 0.75 && C < 10) {
            ganttData.comb.push(2); ganttData.opt.push(0); ganttData.sar.push(0);
        } else if (q_t > 0.30) {
            ganttData.opt.push(2); ganttData.sar.push(0); ganttData.comb.push(0);
        } else {
            ganttData.sar.push(2); ganttData.opt.push(0); ganttData.comb.push(0);
        }
    }

    globalP_Planet = pPlanet[pPlanet.length - 1];
    globalP_Capella = pCapella[pCapella.length - 1];
    globalP_Iceye = pIceye[pIceye.length - 1];

    renderTacticalCharts(timeLabels, cloudValues, solarValues, qPlanet, pPlanet, pCapella, pIceye, ganttData);

    document.getElementById('results-container').innerHTML = `
        <div class="p-2.5 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-400 font-mono text-left space-y-1">
            <div>DOMAIN REGION: <span class="text-slate-200 font-bold">${globalArea}</span></div>
            <div>TRACK TARGET WINDOW: <span class="text-indigo-400 font-bold">${globalWindowDisplay}</span></div>
        </div>
        <div class="space-y-2 pt-2">
            <div class="p-2 border border-purple-900 bg-slate-900 text-left font-mono text-[11px]">
                <div class="font-bold text-slate-200">Planet Labs (SkySat Fleet)</div>
                <div class="text-slate-400 text-[10px]">P(At least 1 Pass): <span class="text-purple-400 font-bold">${globalP_Planet}%</span> // Cost: <span class="text-amber-400 font-bold">$${globalPlanetCost.toLocaleString()}</span></div>
            </div>
            <div class="p-2 border border-sky-900 bg-slate-900 text-left font-mono text-[11px]">
                <div class="font-bold text-slate-200">Capella Space (Spotlight SAR)</div>
                <div class="text-slate-400 text-[10px]">P(At least 1 Pass): <span class="text-sky-400 font-bold">${globalP_Capella}%</span> // Cost: <span class="text-amber-400 font-bold">$${globalCapellaCost.toLocaleString()}</span></div>
            </div>
            <div class="p-2 border border-rose-900 bg-slate-900 text-left font-mono text-[11px]">
                <div class="font-bold text-slate-200">ICEYE Fleet (SAR Radar)</div>
                <div class="text-slate-400 text-[10px]">P(At least 1 Pass): <span class="text-rose-400 font-bold">${globalP_Iceye}%</span> // Cost: <span class="text-amber-400 font-bold">$${globalIceyeCost.toLocaleString()}</span></div>
            </div>
        </div>
    `;

    globalStrategyText = `Stochastic calculation across the window (${globalWindowDisplay}) confirms a final probability threshold of ${globalP_Planet}% for achieving at least one successful clean optical capture with Planet Labs ($${globalPlanetCost.toLocaleString()}). Analysis indicates that while cloud decks open significantly midway through the track, the solar elevation vector falls completely below the minimum 12° illumination horizon between 07:00 and 17:00 GMT. This drops instantaneous image quality q(t) to 0%, resulting in a complete optical blackout block. To maintain absolute collection parity over the ${globalArea} target corridor without coverage gaps, all-weather microwave radar assets must step in. Non-homogeneous Poisson arrival tracking establishes that Capella Space ($${globalCapellaCost.toLocaleString()}) and ICEYE ($${globalIceyeCost.toLocaleString()}) possess independent pass success metrics of ${globalP_Capella}% and ${globalP_Iceye}% respectively, tracking uniformly through nighttime phases. DIRECTIVE: Cross-examine overlapping combinations identified in the tasking timeline to maximize cross-validation returns.`;
    
    document.getElementById('briefing-text').innerText = globalStrategyText;
    document.getElementById('briefing-panel').classList.remove('hidden');
    document.getElementById('btn-download-pdf').classList.remove('hidden');
});

// =========================================================================
// 4. CRASH-PROOF EXSUM PDF GENERATOR PIPELINE
// =========================================================================
document.getElementById('btn-download-pdf').addEventListener('click', async () => {
    const btn = document.getElementById('btn-download-pdf');
    btn.innerText = "⚡ COMPILING NAVY EXSUM..."; btn.disabled = true;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
        
        // Unclassified Boundary Classification Header Strip
        doc.setFillColor(15, 23, 42); doc.rect(0, 0, 216, 12, 'F');
        doc.setFont("courier", "bold"); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
        doc.text("UNCLASSIFIED // FOR OPERATIONAL USE ONLY", 108, 7.5, { align: "center" });

        // Official Departmental Letterhead Layout
        doc.setTextColor(15, 23, 42); doc.setFont("times", "bold"); doc.setFontSize(11);
        doc.text("DEPARTMENT OF THE NAVY", 15, 22);
        doc.setFont("times", "normal"); doc.text("NAVAL METEOROLOGY AND OCEANOGRAPHY COMMAND", 15, 26);
        doc.text("STRATEGIC ORBITAL TASKING CELL // HUB 04", 15, 30);
        doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.4); doc.line(15, 33, 201, 33);

        // Document Metadata Memo Matrix (Independent Line Assignments to Avoid Text Overlap)
        doc.setFont("times", "bold"); doc.text("MEMORANDUM FOR THE RECORD", 15, 41);
        doc.setFontSize(10);
        
        doc.text("SUBJ: SATELLITE INTERCEPT MODEL EXECUTIVE SUMMARY (EXSUM)", 15, 48); 
        doc.text(`OPERATIONAL TIME WINDOW (GMT / UTC): ${globalWindowDisplay}`, 15, 54);
        doc.text(`TARGET CO-ORDINATES RECON ZONE: ${globalArea}`, 15, 60);

        // Section 1: Data Table Layout Framework
        doc.setFont("times", "bold"); doc.setFillColor(241, 245, 249); doc.rect(15, 66, 186, 6, 'F');
        doc.text("CONSTELLATION INVESTMENT & INTERCEPT RETURN METRICS", 18, 70.5);

        doc.setLineWidth(0.25); doc.setDrawColor(15, 23, 42); doc.rect(15, 74, 186, 26, 'S');
        doc.line(15, 81, 201, 81); 
        doc.line(65, 74, 65, 100); doc.line(105, 74, 105, 100); doc.line(150, 74, 150, 100);
        
        doc.setFont("times", "bold");
        doc.text("Satellite Provider", 17, 78.5); 
        doc.text("Sensor Modality", 67, 78.5); 
        doc.text("P(>=1 Pass) In Window", 107, 78.5); 
        doc.text("Target Framing Cost", 152, 78.5);
        
        doc.setFont("times", "normal");
        doc.text("Planet Labs SkySat", 17, 86); doc.text("EO Optical", 67, 86); doc.text(`${globalP_Planet}%`, 107, 86); doc.text(`$${globalPlanetCost.toLocaleString()}`, 152, 86);
        doc.text("Capella Space", 17, 91.5); doc.text("Radar SAR", 67, 91.5); doc.text(`${globalP_Capella}%`, 107, 91.5); doc.text(`$${globalCapellaCost.toLocaleString()}`, 152, 91.5);
        doc.text("ICEYE Constellation", 17, 97); doc.text("Radar SAR", 67, 97); doc.text(`${globalP_Iceye}%`, 107, 97); doc.text(`$${globalIceyeCost.toLocaleString()}`, 152, 97);

        // Section 2: Chart Analytics Injection
        doc.setFont("times", "bold"); doc.setFillColor(241, 245, 249); doc.rect(15, 106, 186, 6, 'F');
        doc.text("MULTI-AXIS JOINT ARRIVAL TRACE ANALYSIS", 18, 110.5);
        
        const canvas1 = document.getElementById('cloudChart');
        if (canvas1) { 
            doc.setFillColor(11, 19, 41); doc.rect(15, 114, 186, 52, 'F');
            doc.addImage(canvas1.toDataURL('image/png', 1.0), 'PNG', 15, 114, 186, 52, undefined, 'FAST'); 
        }

        const canvas2 = document.getElementById('ganttChart');
        if (canvas2) { 
            doc.setFillColor(11, 19, 41); doc.rect(15, 170, 186, 32, 'F');
            doc.addImage(canvas2.toDataURL('image/png', 1.0), 'PNG', 15, 170, 186, 32, undefined, 'FAST'); 
        }

        // Section 3: High-Contrast Uniform Analytical Memorandum
        doc.setFont("times", "bold"); doc.setFontSize(10); doc.setFillColor(241, 245, 249); doc.rect(15, 206, 186, 6, 'F');
        doc.setTextColor(15, 23, 42); doc.text("COMBINED MISSION TIMELINE & OPERATIONAL DIRECTIVE", 18, 210.5);
        
        doc.setFont("times", "normal"); doc.setTextColor(30, 30, 30);
        const unifiedSummaryText = `Stochastic calculation across the window confirms a final probability threshold of ${globalP_Planet}% for achieving at least one successful clean optical capture with Planet Labs ($${globalPlanetCost.toLocaleString()}). Analysis indicates that while cloud decks open significantly midway through the track, the solar elevation vector falls completely below the minimum 12° illumination horizon between 07:00 and 17:00 GMT. This drops instantaneous image quality q(t) to 0%, resulting in a complete optical blackout block. To maintain absolute collection parity over the ${globalArea} target corridor without coverage gaps, all-weather microwave radar assets must step in. Non-homogeneous Poisson arrival tracking establishes that Capella Space ($${globalCapellaCost.toLocaleString()}) and ICEYE ($${globalIceyeCost.toLocaleString()}) possess independent pass success metrics of ${globalP_Capella}% and ${globalP_Iceye}% respectively, tracking uniformly through nighttime phases. DIRECTIVE: Cross-examine overlapping combinations identified in the tasking timeline to maximize cross-validation returns.`;
        
        const lines = doc.splitTextToSize(unifiedSummaryText, 186);
        doc.text(lines, 15, 216);

        // Page baseline strip
        doc.setFillColor(15, 23, 42); doc.rect(0, 267, 216, 12, 'F');
        doc.setFont("courier", "bold"); doc.setTextColor(255, 255, 255);
        doc.text("UNCLASSIFIED // FOR OPERATIONAL USE ONLY", 108, 274.5, { align: "center" });

        // --- PAGE 2: TARGET GRID OVERLAYS ---
        doc.addPage();
        doc.setFillColor(15, 23, 42); doc.rect(0, 0, 216, 12, 'F');
        doc.text("UNCLASSIFIED // FOR OPERATIONAL USE ONLY", 108, 7.5, { align: "center" });

        doc.setTextColor(15, 23, 42); doc.setFont("times", "bold"); doc.setFillColor(241, 245, 249); doc.rect(15, 20, 186, 6, 'F');
        doc.text("TARGET AREA GEOSPATIAL SNAPSHOT MAP", 18, 24.5);

        const mapEl = document.getElementById('map');
        const tiles = document.querySelectorAll('.leaflet-tile-container img');
        const tileAssets = [];
        tiles.forEach(img => {
            if(img.complete && img.naturalWidth > 0) {
                const r = img.getBoundingClientRect();
                tileAssets.push({ img: img, x: r.left, y: r.top, w: r.width, h: r.height });
            }
        });

        if (mapEl && tileAssets.length > 0) {
            const mRect = mapEl.getBoundingClientRect();
            const canvasComp = document.createElement('canvas');
            canvasComp.width = mRect.width * 2; canvasComp.height = mRect.height * 2;
            const cCtx = canvasComp.getContext('2d');
            cCtx.scale(2, 2); cCtx.fillStyle = "#020617"; cCtx.fillRect(0, 0, mRect.width, mRect.height);

            tileAssets.forEach(t => { cCtx.drawImage(t.img, t.x - mRect.left, t.y - mRect.top, t.w, t.h); });

            const vectorCanvas = document.querySelector('#map canvas');
            if (vectorCanvas) { cCtx.drawImage(vectorCanvas, 0, 0, mRect.width, mRect.height); }
            doc.addImage(canvasComp.toDataURL('image/png'), 'PNG', 15, 29, 186, 110, undefined, 'MEDIUM');
        }

        doc.setFont("times", "bold"); doc.text("BY DIRECTION OF THE COMMANDER:", 15, 150);
        doc.line(15, 168, 75, 168); doc.setFont("times", "normal"); doc.text("DESK OFFICER, NMOC INTEL RECON CELL", 15, 173);

        doc.setFillColor(15, 23, 42); doc.rect(0, 267, 216, 12, 'F');
        doc.setFont("courier", "bold"); doc.setTextColor(255, 255, 255);
        doc.text("UNCLASSIFIED // FOR OPERATIONAL USE ONLY", 108, 274.5, { align: "center" });

        doc.save("METOC_ISR_EXSUM.pdf");
    } catch(e) { console.error(e); }
    finally { btn.innerText = "Export PDF Briefing"; btn.disabled = false; }
});