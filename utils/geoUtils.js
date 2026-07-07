export function parseBBoxString(minStr, maxStr) {
    const minArr = minStr.split(',').map(Number);
    const maxArr = maxStr.split(',').map(Number);
    return [minArr[1], minArr[0], maxArr[1], maxArr[0]]; // [minLon, minLat, maxLon, maxLat]
}

export function generateMockSTACItem(vendor, type, resolution, baseCost, lat, lon) {
    const futureOffsetMinutes = Math.floor(Math.random() * 180) + 15;
    const captureTime = new Date(Date.now() + futureOffsetMinutes * 60000);
    
    return {
        type: "Feature",
        stac_version: "1.0.0",
        id: `${vendor.toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`,
        properties: {
            provider: vendor,
            modality: type, // Optical, SAR, R&D
            resolution_gsd: resolution, // in meters
            cost: baseCost + Math.floor(Math.random() * 200),
            time: captureTime.toISOString(),
            cloud_cover_forecast: type === 'SAR' ? 0 : Math.floor(Math.random() * 60)
        },
        geometry: {
            type: "Point",
            coordinates: [lon, lat]
        }
    };
}