/**
 * Estimates the ground area of a bounding box footprint in square kilometers.
 */
export function calculateBBoxAreaKm2(bbox) {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const latMid = (minLat + maxLat) / 2;
    
    const kmPerDegLat = 111.13;
    const kmPerDegLon = 111.32 * Math.cos(latMid * Math.PI / 180);
    
    const height = Math.abs(maxLat - minLat) * kmPerDegLat;
    const width = Math.abs(maxLon - minLon) * kmPerDegLon;
    
    return Math.max(0.1, height * width);
}

export function parseBBoxString(minStr, maxStr) {
    const minArr = minStr.split(',').map(Number);
    const maxArr = maxStr.split(',').map(Number);
    return [minArr[1], minArr[0], maxArr[1], maxArr[0]]; // [minLon, minLat, maxLon, maxLat]
}