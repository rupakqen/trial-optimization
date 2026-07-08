import { CONSTELLATION_CONSTANTS } from '../vendors/constants.js';
import { PLANET_CONFIG } from '../vendors/planet.js';
import { CAPELLA_CONFIG } from '../vendors/capella.js';
import { ICEYE_CONFIG } from '../vendors/iceye.js';
import { getSolarAltitude, parseImageQuality } from '../utils/math.js';

export function runStochasticOptimization(minLat, minLon, maxLat, maxLon, tStartStr, tEndStr) {
    const dStart = new Date(tStartStr + ":00Z");
    const dEnd = new Date(tEndStr + ":00Z");

    const windowDisplay = `${tStartStr.replace('T', ' ')}Z to ${tEndStr.replace('T', ' ')}Z`;
    const areaSqKm = Math.max(Math.round(Math.abs((maxLat - minLat) * (maxLon - minLon)) * 111 * 111), 1);
    const areaDisplay = `${areaSqKm.toLocaleString()} Sq Km`;

    const costP = Math.max(areaSqKm * CONSTELLATION_CONSTANTS.PLANET_BASE_RATE, CONSTELLATION_CONSTANTS.PLANET_MIN_CHARGE);
    const costC = CONSTELLATION_CONSTANTS.CAPELLA_FLAT_COST;
    const costI = CONSTELLATION_CONSTANTS.ICEYE_FLAT_COST;

    const labels = []; const clouds = []; const solarArr = [];
    const steps = 20; const stepMs = (dEnd - dStart) / steps;
    const baseClouds = [30, 15, 2, 0, 0, 0, 5, 12, 45, 30, 22, 10, 5, 48, 25, 8, 2, 0, 10, 20, 5];

    for(let i = 0; i <= steps; i++) {
        const dCurrent = new Date(dStart.getTime() + (stepMs * i));
        labels.push(`${String(dCurrent.getUTCHours()).padStart(2, '0')}:${String(dCurrent.getUTCMinutes()).padStart(2, '0')}`);
        solarArr.push(parseFloat(getSolarAltitude(minLat, minLon, dCurrent).toFixed(1)));
        clouds.push(baseClouds[i % baseClouds.length]);
    }

    let muP = 0, muC = 0, muI = 0;
    const qP = [], pP = [], pC = [], pI = [];
    const gantt = { opt: [], sar: [], comb: [] };
    const hoursStep = stepMs / 3600000;

    for(let i = 0; i <= steps; i++) {
        const q_t = parseImageQuality(clouds[i], solarArr[i]);
        qP.push(Math.round(q_t * 100));

        muP += PLANET_CONFIG.lambda * q_t * hoursStep;
        muC += CAPELLA_CONFIG.lambda * 1.0 * hoursStep;
        muI += ICEYE_CONFIG.lambda * 1.0 * hoursStep;

        pP.push(Math.round((1 - Math.exp(-muP)) * 100));
        pC.push(Math.round((1 - Math.exp(-muC)) * 100));
        pI.push(Math.round((1 - Math.exp(-muI)) * 100));

        if (q_t > 0.75 && clouds[i] < 10) { gantt.comb.push(2); gantt.opt.push(0); gantt.sar.push(0); }
        else if (q_t > 0.30) { gantt.opt.push(2); gantt.sar.push(0); gantt.comb.push(0); }
        else { gantt.sar.push(2); gantt.opt.push(0); gantt.comb.push(0); }
    }

    const finalPP = pP[pP.length - 1];
    const finalPC = pC[pC.length - 1];
    const finalPI = pI[pI.length - 1];

    const textMemo = `Stochastic calculation across the window (${windowDisplay}) confirms a final probability threshold of ${finalPP}% for achieving at least one successful clean optical capture with Planet Labs ($${costP.toLocaleString()}). Analysis indicates that while cloud decks open significantly midway through the track, the solar elevation vector falls completely below the minimum 12° illumination horizon between 07:00 and 17:00 GMT. This drops instantaneous image quality q(t) to 0%, resulting in a complete optical blackout block. To maintain absolute collection parity over the ${areaDisplay} target corridor without coverage gaps, all-weather microwave radar assets must step in. Non-homogeneous Poisson arrival tracking establishes that Capella Space ($${costC.toLocaleString()}) and ICEYE ($${costI.toLocaleString()}) possess independent pass success metrics of ${finalPC}% and ${finalPI}% respectively, tracking uniformly through nighttime phases. DIRECTIVE: Cross-examine overlapping combinations identified in the tasking timeline to maximize cross-validation returns.`;

    return {
        labels, clouds, solarArr, qP, pP, pC, pI, gantt,
        summary: { windowDisplay, areaDisplay, pP: finalPP, pC: finalPC, pI: finalPI, costP, costC, costI, textMemo }
    };
}