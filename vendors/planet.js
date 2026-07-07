import { generateMockSTACItem } from '../utils/geoUtils.js';

export class PlanetAdapter {
    constructor() {
        this.name = 'Planet';
        this.modality = 'Optical';
        this.nativeResolution = 3.0; // 3-meter scope
        this.baseCost = 450;
    }

    async fetchOpportunities(bbox) {
        // Simulating native API fetch call to Planet's /v1/collection-windows
        const targetLat = (bbox[1] + bbox[3]) / 2;
        const targetLon = (bbox[0] + bbox[2]) / 2;
        
        return [
            generateMockSTACItem(this.name, this.modality, this.nativeResolution, this.baseCost, targetLat, targetLon),
            generateMockSTACItem(this.name, this.modality, this.nativeResolution, this.baseCost + 100, targetLat + 0.1, targetLon - 0.1)
        ];
    }
}