export class PlanetAdapter {
    constructor() {
        this.name = 'Planet Labs';
        // Using a public CORS proxy wrapper around the official pricing endpoint
        this.basePricingUrl = 'https://cors-anywhere.herokuapp.com/https://api.planet.com/tasking/v2/pricing/';
    }

    generateGeoJsonGeometry(bbox) {
        return {
            type: "Polygon",
            coordinates: [[
                [bbox[0], bbox[1]],
                [bbox[2], bbox[1]],
                [bbox[2], bbox[3]],
                [bbox[0], bbox[3]],
                [bbox[0], bbox[1]]
            ]]
        };
    }

    async validateAndFetchCost(bbox, timeWindow, apiKey) {
        // Construct standard payload structure matching official documentation
        const orderPayload = {
            name: `NSO_HUB_POLYGON_${Date.now()}`,
            geometry: this.generateGeoJsonGeometry(bbox),
            product: "one_time_tasking"
        };

        if (!apiKey) return { feasible: false, error: "Planet API transaction requires a valid PL_API_KEY token value." };

        try {
            const headers = new Headers();
            // Official Planet Tasking API HTTP Basic Authentication requirement
            headers.append("Authorization", "Basic " + btoa(apiKey + ":"));
            headers.append("Content-Type", "application/json");
            headers.append("Accept", "application/json");

            const response = await fetch(this.basePricingUrl, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(orderPayload)
            });

            if (!response.ok) {
                if (response.status === 429) return { feasible: false, error: "Planet API Limit Exceeded (429 Rate Limited)." };
                const errDetail = await response.text();
                return { feasible: false, error: `Planet Router rejected request: Status ${response.status} - ${errDetail}` };
            }

            const data = await response.json();
            return {
                feasible: true,
                estimatedCost: data.estimated_quota_cost,
                units: data.units || "SQKM",
                determinedBy: data.determined_by || "pricing_model",
                payload: orderPayload
            };
        } catch (netErr) {
            return { feasible: false, error: `CORS Proxy or Network exception: ${netErr.message}` };
        }
    }
}