import { CONSTELLATION_CONSTANTS } from '../vendors/constants.js';

export function getSolarAltitude(lat, lon, dateObj) {
    const rad = Math.PI / 180;
    const day = Math.floor((dateObj - new Date(dateObj.getFullYear(), 0, 0)) / 86400000);
    const declination = 23.45 * Math.sin(rad * (360 / 365 * (day - 81)));
    const hour = dateObj.getUTCHours() + (dateObj.getUTCMinutes() / 60);
    const hourAngle = ((hour + (lon / 15)) - 12) * 15;
    
    let sinAlt = Math.sin(lat * rad) * Math.sin(declination * rad) + 
                  Math.cos(lat * rad) * Math.cos(declination * rad) * Math.cos(hourAngle * rad);
    return Math.max(Math.asin(sinAlt) / rad, 0);
}

export function parseImageQuality(cloudPct, solarAlt) {
    const f_cloud = 1 - (cloudPct / 100);
    const f_sun = solarAlt < CONSTELLATION_CONSTANTS.ILLUMINATION_HORIZON ? 0 : 
                  (solarAlt >= 35 ? 1 : (solarAlt - CONSTELLATION_CONSTANTS.ILLUMINATION_HORIZON) / 23);
    return f_cloud * f_sun;
}