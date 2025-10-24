/**
 * Emergency Overlays Module
 * Fetches and aggregates emergency data from various WA sources
 */

const axios = require('axios');

// Color codes for different overlay types
const SOURCE_COLORS = {
    bushfire: '#FF3232',      // Emergency WA - Red
    dea_hotspot: '#FF8800',   // DEA Hotspots - Orange
    myfirewatch: '#FFD700',   // Landgate - Yellow
    nbn: '#3388ff',           // NBN Outage - Blue
    power: '#6BC143'          // Western Power - Green
};

// Perth center coordinates
const PERTH_CENTER = { lon: 115.8575, lat: -31.9536 };

/**
 * Create a GeoJSON point feature
 */
function createPointFeature(lon, lat, properties, layer) {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [lon, lat]
        },
        properties: {
            ...properties,
            layer,
            markerColor: SOURCE_COLORS[layer]
        }
    };
}

/**
 * Create a GeoJSON FeatureCollection
 */
function createFeatureCollection(features) {
    return {
        type: 'FeatureCollection',
        features
    };
}

/**
 * Fetch bushfire incidents from Emergency WA
 */
async function fetchBushfireIncidents() {
    const url = 'https://emergency.wa.gov.au/data/map.incidents.json';
    try {
        const response = await axios.get(url, { timeout: 10000 });
        const features = [];

        if (response.data && response.data.features) {
            for (const feature of response.data.features) {
                const coords = feature.geometry.coordinates;
                const props = feature.properties;

                features.push(createPointFeature(
                    coords[0],
                    coords[1],
                    {
                        title: props.incident_name || 'Unknown Incident',
                        severity: props.alert_level || 'Unknown',
                        status: props.status || 'Unknown',
                        type: props.incident_type || 'Unknown',
                        created: props.created_date,
                        updated: props.updated_date
                    },
                    'bushfire'
                ));
            }
        }

        return createFeatureCollection(features);
    } catch (error) {
        console.error('Error fetching bushfire incidents:', error.message);
        return createFeatureCollection([]);
    }
}

/**
 * Fetch DEA hotspots
 */
async function fetchDEAHotspots() {
    const url = 'https://hotspots.dea.ga.gov.au/geoserver/wfs?' +
                'service=WFS&version=1.1.0&request=GetFeature&' +
                'typeName=hotspot:hotspots&outputFormat=json';
    try {
        const response = await axios.get(url, { timeout: 10000 });
        const features = [];

        if (response.data && response.data.features) {
            for (const feature of response.data.features) {
                const coords = feature.geometry.coordinates;
                const props = feature.properties;

                features.push(createPointFeature(
                    coords[0],
                    coords[1],
                    {
                        sensor: props.satellite_sensor || 'Unknown',
                        acqTime: props.acquisition_time,
                        power: props.fire_radiative_power,
                        confidence: props.confidence
                    },
                    'dea_hotspot'
                ));
            }
        }

        return createFeatureCollection(features);
    } catch (error) {
        console.error('Error fetching DEA hotspots:', error.message);
        return createFeatureCollection([]);
    }
}

/**
 * Fetch NBN outages (placeholder - requires actual NBN API or scraping)
 */
async function fetchNBNOutages() {
    // NBN doesn't provide a public API, so this is a placeholder
    // In production, you would either scrape their site or use an official API
    return createFeatureCollection([]);
}

/**
 * Fetch Western Power outages (placeholder - requires actual API or scraping)
 */
async function fetchWesternPowerOutages() {
    // Western Power doesn't provide a public API, so this is a placeholder
    // In production, you would either scrape their site or use an official API
    return createFeatureCollection([]);
}

/**
 * Fetch MyFireWatch hotspots (placeholder)
 */
async function fetchMyFireWatchHotspots() {
    // Landgate MyFireWatch doesn't expose direct GeoJSON
    // This would require WMS integration on the frontend
    return createFeatureCollection([]);
}

/**
 * Fetch all emergency overlay data
 */
async function fetchAllFeeds() {
    try {
        const [bushfire, dea, myfirewatch, nbn, power] = await Promise.all([
            fetchBushfireIncidents(),
            fetchDEAHotspots(),
            fetchMyFireWatchHotspots(),
            fetchNBNOutages(),
            fetchWesternPowerOutages()
        ]);

        return {
            bushfire,
            dea_hotspot: dea,
            myfirewatch,
            nbn,
            power,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error fetching emergency feeds:', error.message);
        return {
            bushfire: createFeatureCollection([]),
            dea_hotspot: createFeatureCollection([]),
            myfirewatch: createFeatureCollection([]),
            nbn: createFeatureCollection([]),
            power: createFeatureCollection([]),
            timestamp: new Date().toISOString(),
            error: error.message
        };
    }
}

/**
 * Layer metadata for UI
 */
const LAYER_META = {
    bushfire: { label: 'Bushfires (DFES)', color: SOURCE_COLORS.bushfire },
    dea_hotspot: { label: 'Satellite Hotspots (DEA)', color: SOURCE_COLORS.dea_hotspot },
    myfirewatch: { label: 'WA MyFireWatch', color: SOURCE_COLORS.myfirewatch },
    nbn: { label: 'NBN Outages', color: SOURCE_COLORS.nbn },
    power: { label: 'Western Power Outages', color: SOURCE_COLORS.power }
};

module.exports = {
    fetchAllFeeds,
    fetchBushfireIncidents,
    fetchDEAHotspots,
    fetchNBNOutages,
    fetchWesternPowerOutages,
    fetchMyFireWatchHotspots,
    LAYER_META,
    SOURCE_COLORS
};
