import { CONSTELLATION_CONSTANTS } from '../vendors/constants.js';

export async function compileStrategicReport(runtimeData, metricsPayload) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    
    // =========================================================================
    // PAGE 1: STRATEGIC MEMORANDUM & DATA TRENDS
    // =========================================================================
    
    // Header Border Frame
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 216, 12, 'F');
    doc.setFont("courier", "bold"); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text("UNCLASSIFIED // FOR OPERATIONAL USE ONLY", 108, 7.5, { align: "center" });

    // Formal Letterhead Layout Frame
    doc.setTextColor(15, 23, 42); doc.setFont("times", "bold"); doc.setFontSize(11);
    doc.text("DEPARTMENT OF THE NAVY", 15, 22);
    doc.setFont("times", "normal"); doc.text("NAVAL METEOROLOGY AND OCEANOGRAPHY COMMAND", 15, 26);
    doc.text("STRATEGIC ORBITAL TASKING CELL // HUB 04", 15, 30);
    doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.4); doc.line(15, 33, 201, 33);

    // Metadata Block
    doc.setFont("times", "bold"); doc.text("MEMORANDUM FOR THE RECORD", 15, 41);
    doc.setFontSize(10);
    doc.text(`SUBJ: SATELLITE INTERCEPT MODEL EXECUTIVE SUMMARY (EXSUM)`, 15, 48); 
    doc.text(`OPERATIONAL TIME WINDOW (GMT / UTC): ${runtimeData.windowDisplay}`, 15, 54);
    doc.text(`TARGET CO-ORDINATES RECON ZONE: ${runtimeData.areaDisplay}`, 15, 60);

    // Table Header Area
    doc.setFillColor(241, 245, 249); doc.rect(15, 66, 186, 6, 'F');
    doc.text("CONSTELLATION INVESTMENT & INTERCEPT RETURN METRICS", 18, 70.5);

    // Render Data Table Outlines
    doc.setLineWidth(0.25); doc.setDrawColor(15, 23, 42); doc.rect(15, 74, 186, 26, 'S');
    doc.line(15, 81, 201, 81); doc.line(65, 74, 65, 100); doc.line(105, 74, 105, 100); doc.line(150, 74, 150, 100);
    
    doc.setFont("times", "bold");
    doc.text("Satellite Provider", 17, 78.5); doc.text("Sensor Modality", 67, 78.5); doc.text("P(>=1 Pass) In Window", 107, 78.5); doc.text("Target Framing Cost", 152, 78.5);
    
    doc.setFont("times", "normal");
    doc.text("Planet Labs SkySat", 17, 86); doc.text("EO Optical", 67, 86); doc.text(`${runtimeData.pP}%`, 107, 86); doc.text(`$${runtimeData.costP.toLocaleString()}`, 152, 86);
    doc.text("Capella Space", 17, 91.5); doc.text("Radar SAR", 67, 91.5); doc.text(`${runtimeData.pC}%`, 107, 91.5); doc.text(`$${runtimeData.costC.toLocaleString()}`, 152, 91.5);
    doc.text("ICEYE Constellation", 17, 97); doc.text("Radar SAR", 67, 97); doc.text(`${runtimeData.pI}%`, 107, 97); doc.text(`$${runtimeData.costI.toLocaleString()}`, 152, 97);

    // Section Title for Charts
    doc.setFont("times", "bold"); doc.setFillColor(241, 245, 249); doc.rect(15, 106, 186, 6, 'F');
    doc.text("MULTI-AXIS JOINT ARRIVAL TRACE ANALYSIS", 18, 110.5);

    // =========================================================================
    // IN-MEMORY HIGH-RESOLUTION CANVAS GENERATION BLOCK
    // =========================================================================
    // We isolate these setups with an exact print aspect ratio (3:1 and 5:1)
    
    // 1. Stochastic Arrival Chart Memory Instantiation
    const primaryCanvas = document.createElement('canvas');
    primaryCanvas.width = 1200; primaryCanvas.height = 450; // Locked high-density dimension
    const pCtx = primaryCanvas.getContext('2d');

    const pdfPrimaryChart = new Chart(pCtx, {
        type: 'line',
        data: {
            labels: metricsPayload.labels,
            datasets: [
                { label: 'Planet Cum P %', data: metricsPayload.pP, borderColor: '#A855F7', borderWidth: 4, pointRadius: 2, yAxisID: 'y' },
                { label: 'Planet Quality %', data: metricsPayload.qP, borderColor: '#22C55E', borderWidth: 3, pointRadius: 0, yAxisID: 'y' },
                { label: 'Capella Cum P %', data: metricsPayload.pC, borderColor: '#38BDF8', borderWidth: 2.5, borderDash: [4, 4], pointRadius: 0, yAxisID: 'y' },
                { label: 'ICEYE Cum P %', data: metricsPayload.pI, borderColor: '#F43F5E', borderWidth: 2.5, borderDash: [6, 6], pointRadius: 0, yAxisID: 'y' },
                { label: 'Clouds %', data: metricsPayload.clouds, borderColor: '#64748B', borderWidth: 1.5, pointRadius: 0, yAxisID: 'y' },
                { label: 'Solar Alt (°)', data: metricsPayload.solarArr, borderColor: '#F59E0B', borderWidth: 2, borderDash: [8, 8], pointRadius: 0, yAxisID: 'y1' }
            ]
        },
        options: {
            animation: false, responsive: false, devicePixelRatio: 2,
            plugins: { 
                legend: { labels: { color: '#0F172A', font: { size: 12, family: 'serif', weight: 'bold' } } } 
            },
            scales: {
                x: { ticks: { color: '#0F172A', font: { size: 10, weight: 'bold' } }, grid: { color: '#CBD5E1' } },
                y: { min: 0, max: 100, ticks: { color: '#0F172A', font: { size: 10 } }, grid: { color: '#CBD5E1' } },
                y1: { min: 0, max: 90, display: true, position: 'right', ticks: { color: '#B45309' }, grid: { drawOnChartArea: false } }
            }
        }
    });

    // 2. Gantt Window Chart Memory Instantiation
    const ganttCanvas = document.createElement('canvas');
    ganttCanvas.width = 1200; ganttCanvas.height = 240;
    const gCtx = ganttCanvas.getContext('2d');

    const pdfGanttChart = new Chart(gCtx, {
        type: 'bar',
        data: {
            labels: metricsPayload.labels,
            datasets: [
                { label: 'Optical Preferred', data: metricsPayload.gantt.opt, backgroundColor: '#A855F7', barPercentage: 0.9 },
                { label: 'SAR Mandatory', data: metricsPayload.gantt.sar, backgroundColor: '#38BDF8', barPercentage: 0.9 },
                { label: 'Combined Target', data: metricsPayload.gantt.comb, backgroundColor: '#22C55E', barPercentage: 0.9 }
            ]
        },
        options: {
            animation: false, responsive: false, devicePixelRatio: 2,
            indexAxis: 'x',
            plugins: { 
                legend: { labels: { color: '#0F172A', font: { size: 11, family: 'serif', weight: 'bold' } } } 
            },
            scales: {
                x: { stacked: true, ticks: { color: '#0F172A', font: { size: 9, weight: 'bold' } }, grid: { color: '#CBD5E1' } },
                y: { stacked: true, min: 0, max: 3, display: false }
            }
        }
    });

    // Inject the perfectly scaled images into the document vectors
    doc.addImage(primaryCanvas.toDataURL('image/png', 1.0), 'PNG', 15, 114, 186, 52, undefined, 'NONE');
    doc.addImage(ganttCanvas.toDataURL('image/png', 1.0), 'PNG', 15, 170, 186, 32, undefined, 'NONE');

    // Clean up memory space instantly
    pdfPrimaryChart.destroy();
    pdfGanttChart.destroy();

    // Combined Mission Narrative Memo Section
    doc.setFont("times", "bold"); doc.setFillColor(241, 245, 249); doc.rect(15, 206, 186, 6, 'F');
    doc.setTextColor(15, 23, 42); doc.text("COMBINED MISSION TIMELINE & OPERATIONAL DIRECTIVE", 18, 210.5);
    
    doc.setFont("times", "normal"); doc.setTextColor(30, 30, 30);
    const splitLines = doc.splitTextToSize(runtimeData.textMemo, 186);
    doc.text(splitLines, 15, 216);

    // Page 1 Footer System
    doc.setFillColor(15, 23, 42); doc.rect(0, 267, 216, 12, 'F');
    doc.setFont("courier", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("UNCLASSIFIED // FOR OPERATIONAL USE ONLY", 108, 274.5, { align: "center" });

    // =========================================================================
    // PAGE 2: TARGET GRID OVERLAYS
    // =========================================================================
    doc.addPage();
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 216, 12, 'F');
    doc.text("UNCLASSIFIED // FOR OPERATIONAL USE ONLY", 108, 7.5, { align: "center" });

    doc.setTextColor(15, 23, 42); doc.setFont("times", "bold"); doc.setFillColor(241, 245, 249); doc.rect(15, 20, 186, 6, 'F');
    doc.text("TARGET AREA GEOSPATIAL SNAPSHOT MAP", 18, 24.5);

    // Geospatial Leaflet Rasterization Engine Block
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

    doc.setFont("times", "bold"); doc.setTextColor(15, 23, 42);
    doc.text("BY DIRECTION OF THE COMMANDER:", 15, 155);
    doc.line(15, 173, 75, 173); doc.setFont("times", "normal"); doc.text("DESK OFFICER, NMOC INTEL RECON CELL", 15, 178);

    doc.setFillColor(15, 23, 42); doc.rect(0, 267, 216, 12, 'F');
    doc.setFont("courier", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("UNCLASSIFIED // FOR OPERATIONAL USE ONLY", 108, 274.5, { align: "center" });

    doc.save("METOC_ISR_EXSUM.pdf");
}