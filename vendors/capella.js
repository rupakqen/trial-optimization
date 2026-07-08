import { calculateBBoxAreaKm2 } from '../utils/geoUtils.js';

export class CapellaAdapter {
    constructor() {
        this.name = 'Capella Space';
        this.endpoint = 'https://api.capellaspace.com/v1/tasking/requests';
        this.minAreaKm2 = 100.0; // Capella standard strip footprint limit validation rule
    }

    async validateAndFetchCost(bbox, timeWindow, apiKey, useSandbox) {
        const area = calculateBBoxAreaKm2(bbox);
        if (area < this.minAreaKm2) {
            return { feasible: false, error: `Capella strip restriction deficit (${area.toFixed(1)} km²). Minimum requirement threshold is 100.0 km².` };
        }

        const taskingPayload = {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [[
                    [bbox[0], bbox[1]], [bbox[2], bbox[1]], [bbox[2], bbox[3]], [bbox[0], bbox[3]], [bbox[0], bbox[1]]
                ]]
            },
            properties: {
                taskingWindow: {
                    openDateTime: new Date(timeWindow.start).toISOString(),
                    closeDateTime: new Date(timeWindow.end).toISOString()
                },
                imagingMode: "sliding_spotlight",
                lookDirection: "either"
            }
        };

        if (useSandbox) {
            return { feasible: true, estimatedCost: Math.round(area * 24), payload: taskingPayload };
        }

        if (!apiKey) return { feasible: false, error: "Missing authentic Capella Bearer key." };

        try {
            const response = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(taskingPayload)
            });

            if (!response.ok) return { feasible: false, error: `Capella Engine returned error code: ${response.status}` };
            const data = await response.json();
            return { feasible: true, estimatedCost: Math.round(area * 24), payload: taskingPayload };
        } catch (e) {
            return { feasible: false, error: `CORS / Network failure to authenticate with Capella Console.` };
        }
    }
}