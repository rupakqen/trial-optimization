import { parseBBoxString } from './utils/geoUtils.js';
import { fetchPredictiveWeather } from './utils/weather.js';
import { HubOptimizationEngine } from './engine/optimizer.js';

// Auto-register independent Spoke Adapters
import { PlanetAdapter } from './vendors/planet.js';
import { MaxarAdapter } from './vendors/maxar.js';
import { CapellaAdapter } from './vendors/capella.js';
import { IceyeAdapter } from './vendors/iceye.js';

// Initialize Map object centered over strategic ocean channels
const map = L.map('map').setView([35.00, -119.00], 7);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

let selectionLayer = null;

// Dynamic weight display bindings
const wRes = document.getElementById('weight-res');
const wSpeed = document.getElementById('weight-speed');
const wCost = document.getElementById('weight-cost');

const updateWeightDisplays = () => {
    document.getElementById('weight-res-val').innerText = wRes.value;
    document.getElementById('weight-speed-val').innerText = wSpeed.value;
    document.getElementById('weight-cost-val').innerText = wCost.value;
};
[wRes, wSpeed, wCost].forEach(input => input.addEventListener('input', updateWeightDisplays));

// Map Click-and-Drag Bounding Box Capture simulation
map.on('mousedown', (e) => {
    if(selectionLayer) map.removeLayer(selectionLayer);
    const startLatLng = e.latlng;
    
    map.on('mouseup', (el) => {
        const endLatLng = el.latlng;
        const bounds = [[startLatLng.lat, startLatLng.lng], [endLatLng.lat, endLatLng.lng]];
        selectionLayer = L.rectangle(bounds, {color: "#6366f1", weight: 2, fillColor: "#6366f1", fillOpacity: 0.1}).addTo(map);
        
        document.getElementById('bbox-min').value = `${startLatLng.lat.toFixed(2)}, ${startLatLng.lng.toFixed(2)}`;
        document.getElementById('bbox-max').value = `${endLatLng.lat.toFixed(2)}, ${endLatLng.lng.toFixed(2)}`;
        map.off('mousemove mouseup');
    });
});

// Run Core Hub Optimization
document.getElementById('btn-optimize').addEventListener('click', async () => {
    const minVal = document.getElementById('bbox-min').value;
    const maxVal = document.getElementById('bbox-max').value;
    const bbox = parseBBoxString(minVal, maxVal);

    // 1. Instantaneous environment meteorological check
    const weather = fetchPredictiveWeather(bbox);
    
    // 2. Instantiate optimization environment engine running registered spokes
    const activeSpokes = [new PlanetAdapter(), new MaxarAdapter(), new CapellaAdapter(), new IceyeAdapter()];
    const hub = new HubOptimizationEngine(activeSpokes);

    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = `<div class="text-indigo-400 animate-pulse text-center py-6 font-mono">BROKERING DISPARATE API WINDOWS...</div>`;

    // 3. Harvest windows and optimize array
    const rawOpportunities = await hub.harvestAllOpportunities(bbox);
    const weights = { resolution: parseFloat(wRes.value), speed: parseFloat(wSpeed.value), cost: parseFloat(wCost.value) };
    const rankedOptions = hub.calculateFeasibility(rawOpportunities, weights, weather);

    // 4. Update Client UI View Layer
    resultsContainer.innerHTML = `
        <div class="bg-slate-950 p-2 border border-slate-800 text-slate-400 rounded mb-2 flex justify-between font-mono text-[10px]">
            <span>MET FORECAST CLOUDS: ${weather.cloudCoverPercentage.toFixed(1)}%</span>
            <span>STATUS: READY</span>
        </div>
    `;

    rankedOptions.forEach((opt, index) => {
        const p = opt.properties;
        const badgeColor = p.modality === 'SAR' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
        const rankBorder = index === 0 ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800 bg-slate-900';

        resultsContainer.innerHTML += `
            <div class="p-4 rounded-lg border ${rankBorder} transition hover:border-slate-700 flex flex-col space-y-2">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-slate-200 text-sm">${p.provider} <span class="text-[10px] px-2 py-0.5 border rounded ml-2 ${badgeColor}">${p.modality}</span></span>
                    <span class="text-emerald-400 font-mono font-bold text-sm">${opt.score} pts</span>
                </div>
                <div class="grid grid-cols-3 gap-1 text-[11px] text-slate-400 font-mono pt-1">
                    <div>Res: <span class="text-slate-200">${p.resolution_gsd}m</span></div>
                    <div>Cost: <span class="text-slate-200">$${p.cost}</span></div>
                    <div>Clouds: <span class="text-slate-200">${p.cloud_cover_forecast}%</span></div>
                </div>
                <div class="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                    Window: ${new Date(p.time).toLocaleTimeString()} (${Math.round((new Date(p.time) - Date.now()) / 60000)} mins out)
                </div>
            </div>
        `;

        // Draw spatial footprint on interactive map pane
        L.circle([opt.geometry.coordinates[1], opt.geometry.coordinates[0]], {
            color: index === 0 ? '#10b981' : '#6366f1',
            fillColor: index === 0 ? '#10b981' : '#6366f1',
            fillOpacity: 0.2,
            radius: 8000
        }).addTo(map).bindPopup(`<b>${p.provider} Opportunity</b><br>Score: ${opt.score}`);
    });
});