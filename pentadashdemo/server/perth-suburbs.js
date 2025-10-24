/**
 * Perth Suburbs Geocoding and Boundary Service
 * Provides suburb boundary data and geocoding for Perth metro area
 */

// Major Perth suburbs with approximate boundary polygons
const PERTH_SUBURBS = {
    'Perth CBD': {
        center: { lat: -31.9505, lon: 115.8605 },
        bounds: [
            [115.8505, -31.9605],
            [115.8705, -31.9605],
            [115.8705, -31.9405],
            [115.8505, -31.9405],
            [115.8505, -31.9605]
        ],
        postcode: '6000',
        population: 23000
    },
    'Fremantle': {
        center: { lat: -32.0557, lon: 115.7478 },
        bounds: [
            [115.7378, -32.0657],
            [115.7578, -32.0657],
            [115.7578, -32.0457],
            [115.7378, -32.0457],
            [115.7378, -32.0657]
        ],
        postcode: '6160',
        population: 8500
    },
    'Joondalup': {
        center: { lat: -31.7449, lon: 115.7660 },
        bounds: [
            [115.7560, -31.7549],
            [115.7760, -31.7549],
            [115.7760, -31.7349],
            [115.7560, -31.7349],
            [115.7560, -31.7549]
        ],
        postcode: '6027',
        population: 11000
    },
    'Rockingham': {
        center: { lat: -32.2772, lon: 115.7316 },
        bounds: [
            [115.7216, -32.2872],
            [115.7416, -32.2872],
            [115.7416, -32.2672],
            [115.7216, -32.2672],
            [115.7216, -32.2872]
        ],
        postcode: '6168',
        population: 14000
    },
    'Mandurah': {
        center: { lat: -32.5269, lon: 115.7217 },
        bounds: [
            [115.7117, -32.5369],
            [115.7317, -32.5369],
            [115.7317, -32.5169],
            [115.7117, -32.5169],
            [115.7117, -32.5369]
        ],
        postcode: '6210',
        population: 89000
    },
    'Midland': {
        center: { lat: -31.8944, lon: 116.0079 },
        bounds: [
            [115.9979, -31.9044],
            [116.0179, -31.9044],
            [116.0179, -31.8844],
            [115.9979, -31.8844],
            [115.9979, -31.9044]
        ],
        postcode: '6056',
        population: 7400
    },
    'Subiaco': {
        center: { lat: -31.9479, lon: 115.8238 },
        bounds: [
            [115.8138, -31.9579],
            [115.8338, -31.9579],
            [115.8338, -31.9379],
            [115.8138, -31.9379],
            [115.8138, -31.9579]
        ],
        postcode: '6008',
        population: 8400
    },
    'South Perth': {
        center: { lat: -31.9833, lon: 115.8656 },
        bounds: [
            [115.8556, -31.9933],
            [115.8756, -31.9933],
            [115.8756, -31.9733],
            [115.8556, -31.9733],
            [115.8556, -31.9933]
        ],
        postcode: '6151',
        population: 10000
    },
    'Victoria Park': {
        center: { lat: -31.9738, lon: 115.8936 },
        bounds: [
            [115.8836, -31.9838],
            [115.9036, -31.9838],
            [115.9036, -31.9638],
            [115.8836, -31.9638],
            [115.8836, -31.9838]
        ],
        postcode: '6100',
        population: 12000
    },
    'Scarborough': {
        center: { lat: -31.8940, lon: 115.7604 },
        bounds: [
            [115.7504, -31.9040],
            [115.7704, -31.9040],
            [115.7704, -31.8840],
            [115.7504, -31.8840],
            [115.7504, -31.9040]
        ],
        postcode: '6019',
        population: 14000
    },
    'Cannington': {
        center: { lat: -32.0172, lon: 115.9353 },
        bounds: [
            [115.9253, -32.0272],
            [115.9453, -32.0272],
            [115.9453, -32.0072],
            [115.9253, -32.0072],
            [115.9253, -32.0272]
        ],
        postcode: '6107',
        population: 7500
    },
    'Armadale': {
        center: { lat: -32.1484, lon: 116.0104 },
        bounds: [
            [116.0004, -32.1584],
            [116.0204, -32.1584],
            [116.0204, -32.1384],
            [116.0004, -32.1384],
            [116.0004, -32.1584]
        ],
        postcode: '6112',
        population: 12000
    },
    'Ellenbrook': {
        center: { lat: -31.7762, lon: 115.9730 },
        bounds: [
            [115.9630, -31.7862],
            [115.9830, -31.7862],
            [115.9830, -31.7662],
            [115.9630, -31.7662],
            [115.9630, -31.7862]
        ],
        postcode: '6069',
        population: 43000
    },
    'Canning Vale': {
        center: { lat: -32.0622, lon: 115.9169 },
        bounds: [
            [115.9069, -32.0722],
            [115.9269, -32.0722],
            [115.9269, -32.0522],
            [115.9069, -32.0522],
            [115.9069, -32.0722]
        ],
        postcode: '6155',
        population: 33000
    },
    'Baldivis': {
        center: { lat: -32.3321, lon: 115.8296 },
        bounds: [
            [115.8196, -32.3421],
            [115.8396, -32.3421],
            [115.8396, -32.3221],
            [115.8196, -32.3221],
            [115.8196, -32.3421]
        ],
        postcode: '6171',
        population: 36000
    }
};

/**
 * Get all suburbs as GeoJSON FeatureCollection
 */
function getAllSuburbsGeoJSON() {
    const features = Object.keys(PERTH_SUBURBS).map(suburbName => {
        const suburb = PERTH_SUBURBS[suburbName];

        return {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [suburb.bounds]
            },
            properties: {
                name: suburbName,
                postcode: suburb.postcode,
                population: suburb.population,
                center_lat: suburb.center.lat,
                center_lon: suburb.center.lon
            }
        };
    });

    return {
        type: 'FeatureCollection',
        features
    };
}

/**
 * Get suburb center coordinates by name
 */
function getSuburbCenter(suburbName) {
    const suburb = PERTH_SUBURBS[suburbName];
    if (!suburb) {
        return null;
    }
    return suburb.center;
}

/**
 * Find suburb by coordinates (simple point-in-polygon check)
 */
function findSuburbByCoordinates(lat, lon) {
    for (const [suburbName, suburb] of Object.entries(PERTH_SUBURBS)) {
        // Simple bounding box check
        const bounds = suburb.bounds;
        const minLon = Math.min(...bounds.map(p => p[0]));
        const maxLon = Math.max(...bounds.map(p => p[0]));
        const minLat = Math.min(...bounds.map(p => p[1]));
        const maxLat = Math.max(...bounds.map(p => p[1]));

        if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
            return {
                name: suburbName,
                ...suburb
            };
        }
    }
    return null;
}

/**
 * Get all suburb names
 */
function getAllSuburbNames() {
    return Object.keys(PERTH_SUBURBS);
}

/**
 * Search suburbs by name (fuzzy match)
 */
function searchSuburbs(query) {
    const lowerQuery = query.toLowerCase();
    return Object.keys(PERTH_SUBURBS).filter(name =>
        name.toLowerCase().includes(lowerQuery)
    ).map(name => ({
        name,
        ...PERTH_SUBURBS[name]
    }));
}

/**
 * Get suburbs within radius of a point (km)
 */
function getSuburbsWithinRadius(lat, lon, radiusKm) {
    const results = [];

    for (const [suburbName, suburb] of Object.entries(PERTH_SUBURBS)) {
        const distance = calculateDistance(
            lat, lon,
            suburb.center.lat, suburb.center.lon
        );

        if (distance <= radiusKm) {
            results.push({
                name: suburbName,
                distance,
                ...suburb
            });
        }
    }

    return results.sort((a, b) => a.distance - b.distance);
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

module.exports = {
    PERTH_SUBURBS,
    getAllSuburbsGeoJSON,
    getSuburbCenter,
    findSuburbByCoordinates,
    getAllSuburbNames,
    searchSuburbs,
    getSuburbsWithinRadius,
    calculateDistance
};
