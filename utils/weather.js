export function fetchPredictiveWeather(bbox) {
    // Simulating API weather returns based on target coordinates
    const averageLat = (bbox[1] + bbox[3]) / 2;
    return {
        cloudCoverPercentage: Math.abs(Math.sin(averageLat)) * 100, // Deterministic mock weather
        seaStateConducive: true,
        updatedAt: new Date().toISOString()
    };
}