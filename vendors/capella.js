import { generateMockSTACItem } from '../utils/geoUtils.js';

export class CapellaAdapter {
    constructor() {
        this.name = 'Capella Space';
        this.modality = 'SAR';
        this.nativeResolution = 0.5; // High res radar
        this.baseCost = 950;
    }

    async fetchOpportunities(bbox) {
        const targetLat = (bbox[1] + bbox[3]) / 2;
        const targetLon = (bbox[0] + bbox[2]) / 2;
        return [
            generateMockSTACItem(this.name, this.modality, this.nativeResolution, this.baseCost, targetLat - 0.05, targetLon + 0.05)
        ];
    }
}