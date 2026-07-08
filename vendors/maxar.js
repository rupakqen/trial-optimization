import { generateMockSTACItem } from '../utils/geo.js';

export class MaxarAdapter {
    constructor() {
        this.name = 'Maxar';
        this.modality = 'Optical';
        this.nativeResolution = 0.3; // Very precise 30cm resolution
        this.baseCost = 1200; // Premium price
    }

    async fetchOpportunities(bbox) {
        const targetLat = (bbox[1] + bbox[3]) / 2;
        const targetLon = (bbox[0] + bbox[2]) / 2;
        return [
            generateMockSTACItem(this.name, this.modality, this.nativeResolution, this.baseCost, targetLat, targetLon)
        ];
    }
}