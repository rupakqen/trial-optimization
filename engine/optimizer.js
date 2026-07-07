export class HubOptimizationEngine {
    constructor(adaptersList) {
        this.adapters = adaptersList; // Unified array of registered spokes
    }

    async harvestAllOpportunities(bbox) {
        const fetchPromises = this.adapters.map(adapter => 
            adapter.fetchOpportunities(bbox).catch(err => {
                console.error(`Spoke execution error on ${adapter.name}:`, err);
                return []; // Graceful failure mitigation
            })
        );
        const resultsArray = await Promise.all(fetchPromises);
        return resultsArray.flat();
    }

    calculateFeasibility(opportunities, weights, weather) {
        return opportunities.map(opp => {
            const props = opp.properties;
            
            // Step 1: Weather Filter Check
            let weatherPenalty = 0;
            if (props.modality === 'Optical' && weather.cloudCoverPercentage > 15) {
                // Penalize collection effectiveness if weather blocks view
                weatherPenalty = (weather.cloudCoverPercentage / 100) * weights.resolution;
            }

            // Step 2: Feature Normalization (0.0 to 1.0 scaling limits)
            const normRes = (5 - props.resolution_gsd) / 5; // Smaller GSD = higher score
            
            const minutesToCollection = (new Date(props.time) - Date.now()) / 60000;
            const normSpeed = (180 - minutesToCollection) / 180; // Sooner collections score higher
            
            const normCost = (1500 - props.cost) / 1500; // Cheaper costs score higher

            // Step 3: Weighted Linear Matrix Evaluation
            const compositeUtilityScore = 
                (weights.resolution * normRes) + 
                (weights.speed * normSpeed) + 
                (weights.cost * normCost) - 
                weatherPenalty;

            return {
                ...opp,
                score: Math.max(0, compositeUtilityScore * 100).toFixed(1) // Absolute ranking scale
            };
        }).sort((a, b) => b.score - a.score); // Absolute priority sorting ranking
    }
}