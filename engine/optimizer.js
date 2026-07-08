export class HubOptimizationEngine {
    constructor(adaptersList) {
        this.adapters = adaptersList;
    }

    async generateFeasibilityMatrix(bbox, timeWindow, weights, keys, useSandbox) {
        const matrixPromises = this.adapters.map(async (adapter) => {
            // Pick matching client credential token strings
            let key = "";
            if (adapter.name.includes("Planet")) key = keys.planet;
            if (adapter.name.includes("Capella")) key = keys.capella;
            if (adapter.name.includes("ICEYE")) key = keys.iceye;

            const assessment = await adapter.validateAndFetchCost(bbox, timeWindow, key, useSandbox);

            if (!assessment.feasible) {
                return {
                    provider: adapter.name,
                    feasible: false,
                    error: assessment.error,
                    score: 0
                };
            }

            // High Fidelity Variable Native Attributes Scaling Metrics
            const mockGSD = adapter.name.includes("Planet") ? 3.0 : adapter.name.includes("Capella") ? 0.5 : 1.0;
            const normRes = (5.0 - mockGSD) / 5.0; // Prefer smaller GSD metrics
            
            const calculatedCost = assessment.estimatedCost;
            const normCost = (10000 - Math.min(10000, calculatedCost)) / 10000; // Prefer cheaper solutions

            const simulatedRevisitHours = adapter.name.includes("Planet") ? 4 : adapter.name.includes("Capella") ? 12 : 8;
            const normSpeed = (48 - simulatedRevisitHours) / 48; // Prefer shorter delivery timelines

            // Run Multi-Objective Evaluation Formula
            const totalUtilityScore = 
                (weights.resolution * normRes) + 
                (weights.speed * normSpeed) + 
                (weights.cost * normCost);

            return {
                provider: adapter.name,
                feasible: true,
                cost: calculatedCost,
                gsd: mockGSD,
                revisit: simulatedRevisitHours,
                score: Math.max(1, Math.round(totalUtilityScore * 100)),
                payload: assessment.payload
            };
        });

        const completedMatrix = await Promise.all(matrixPromises);
        return completedMatrix.sort((a, b) => b.score - a.score);
    }
}