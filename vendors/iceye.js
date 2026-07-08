import { calculateBBoxAreaKm2 } from '../utils/geoUtils.js';

export class IceyeAdapter {
    constructor() {
        this.name = 'ICEYE';
        this.endpoint = 'https://api.iceye.com/api/tasking/v2/tasks';
        this.minTimeWindowHours = 24.0; 
    }

    async validateAndFetchCost(bbox, timeWindow, apiKey, useSandbox) {
        const durationHours = (new Date(timeWindow.end) - new Date(timeWindow.start)) / 3600000;
        if (durationHours < this.minTimeWindowHours) {
            return { feasible: false, error: `Operational window duration gap (${durationHours.toFixed(1)}h). ICEYE collection scheduling require windows >= 24 hours.` };
        }

        const area = calculateBBoxAreaKm2(bbox);
        const taskingPayload = {
            pointOfInterest: {
                lat: (bbox[1] + bbox[3]) / 2,
                lon: (bbox[0] + bbox[2]) / 2
            },
            acquisitionWindow: {
                start: new Date(timeWindow.start).toISOString(),
                end: new Date(timeWindow.end).toISOString()
            },
            imagingMode: "Spot_Fine",
            priority: "COMMERCIAL"
        };

        if (useSandbox) {
            return { feasible: true, estimatedCost: Math.round(area * 32), payload: taskingPayload };
        }

        if (!apiKey) return { feasible: false, error: "ICEYE transactions require a valid API header authentication value." };

        try {
            const response = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "X-API-KEY": apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(taskingPayload)
            });

            if (!response.ok) return { feasible: false, error: `ICEYE Scheduler returned error state: ${response.status}` };
            return { feasible: true, estimatedCost: Math.round(area * 32), payload: taskingPayload };
        } catch (err) {
            return { feasible: false, error: `Network exception encountered reaching ICEYE platform API.` };
        }
    }
}