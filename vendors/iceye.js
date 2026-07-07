import { generateMockSTACItem } from '../utils/geoUtils.js';

export class IceyeAdapter {
    constructor() {
        this.name = 'ICEYE';
        this.modality = 'SAR';
        this.nativeResolution = 1.0;
        this.baseCost = 700;
    }

    async fetchOpportunities(bbox) {
        const targetLat = (bbox[1] + bbox[3]) / 2;
        const targetLon = (bbox[0] + bbox[2]) / 2;
        return [
            generateMockSTACItem(this.name, this.modality, this.nativeResolution, this.baseCost, targetLat + 0.02, targetLon - 0.03)
        ];
    }
}