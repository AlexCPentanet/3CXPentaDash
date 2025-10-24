/**
 * Australian Infrastructure Monitoring Service
 *
 * Monitors:
 * - NBN Outages
 * - Western Power Outages (Perth, WA)
 * - Emergency Services (Fires, Floods) in Perth, WA
 * - Tower Impact Analysis
 */

const axios = require('axios');
const EventEmitter = require('events');

class AustralianInfrastructureService extends EventEmitter {
    constructor(db) {
        super();
        this.db = db;
        this.towers = [];
        this.activeIncidents = {
            nbn: [],
            power: [],
            fires: [],
            floods: []
        };
        this.updateInterval = null;
    }

    /**
     * Initialize service and start monitoring
     */
    async initialize() {
        console.log('🌏 Initializing Australian Infrastructure Service...');

        // Load tower locations from database
        await this.loadTowers();

        // Start monitoring
        this.startMonitoring();

        console.log('✅ Australian Infrastructure Service initialized');
    }

    /**
     * Load Pentanet tower locations from database
     */
    async loadTowers() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM towers WHERE active = 1`,
                [],
                (err, rows) => {
                    if (err) {
                        console.error('Error loading towers:', err);
                        reject(err);
                    } else {
                        this.towers = rows.map(tower => ({
                            id: tower.id,
                            name: tower.name,
                            latitude: tower.latitude,
                            longitude: tower.longitude,
                            services: JSON.parse(tower.services || '[]'),
                            address: tower.address,
                            radius: tower.alert_radius || 5 // km
                        }));
                        console.log(`📡 Loaded ${this.towers.length} towers`);
                        resolve(this.towers);
                    }
                }
            );
        });
    }

    /**
     * Start monitoring all infrastructure sources
     */
    startMonitoring() {
        // Check every 5 minutes
        this.updateInterval = setInterval(async () => {
            await this.checkAllSources();
        }, 300000);

        // Initial check
        this.checkAllSources();
    }

    /**
     * Check all infrastructure sources
     */
    async checkAllSources() {
        console.log('🔍 Checking Australian infrastructure sources...');

        try {
            await Promise.all([
                this.checkNBNOutages(),
                this.checkPowerOutages(),
                this.checkEmergencyIncidents()
            ]);

            // Analyze tower impacts
            this.analyzeTowerImpacts();

        } catch (error) {
            console.error('Error checking infrastructure:', error);
            this.emit('error', { type: 'check_failed', error });
        }
    }

    /**
     * Check NBN outages
     */
    async checkNBNOutages() {
        try {
            // NBN publishes outage information via their API
            // Note: This is a simulated endpoint - replace with actual NBN API when available
            const response = await axios.get('https://api.nbn.com.au/outages/v1/search', {
                params: {
                    state: 'WA',
                    postcode: '6000,6001,6002,6003,6004,6005,6006,6007,6008,6009,6010', // Perth postcodes
                    status: 'active'
                },
                timeout: 10000,
                validateStatus: () => true // Accept any status for demo
            });

            if (response.status === 200 && response.data) {
                this.activeIncidents.nbn = this.parseNBNOutages(response.data);

                if (this.activeIncidents.nbn.length > 0) {
                    console.log(`⚠️  Found ${this.activeIncidents.nbn.length} NBN outages`);
                    this.emit('nbn_outages_updated', this.activeIncidents.nbn);
                }
            } else {
                // Simulate NBN outages for demo
                this.activeIncidents.nbn = this.simulateNBNOutages();
            }

        } catch (error) {
            console.error('NBN outage check failed:', error.message);
            // Use simulated data as fallback
            this.activeIncidents.nbn = this.simulateNBNOutages();
        }
    }

    /**
     * Check Western Power outages
     */
    async checkPowerOutages() {
        try {
            // Western Power outage map API
            // Note: This is a simulated endpoint - replace with actual API
            const response = await axios.get('https://www.westernpower.com.au/api/outages', {
                params: {
                    region: 'perth'
                },
                timeout: 10000,
                validateStatus: () => true
            });

            if (response.status === 200 && response.data) {
                this.activeIncidents.power = this.parsePowerOutages(response.data);

                if (this.activeIncidents.power.length > 0) {
                    console.log(`⚠️  Found ${this.activeIncidents.power.length} power outages`);
                    this.emit('power_outages_updated', this.activeIncidents.power);
                }
            } else {
                // Simulate power outages for demo
                this.activeIncidents.power = this.simulatePowerOutages();
            }

        } catch (error) {
            console.error('Power outage check failed:', error.message);
            // Use simulated data as fallback
            this.activeIncidents.power = this.simulatePowerOutages();
        }
    }

    /**
     * Check emergency incidents (fires, floods)
     */
    async checkEmergencyIncidents() {
        try {
            // Emergency WA / DFES API
            // Note: This is a simulated endpoint - replace with actual API
            const response = await axios.get('https://www.emergency.wa.gov.au/api/incidents', {
                params: {
                    region: 'perth',
                    types: 'fire,flood',
                    status: 'active'
                },
                timeout: 10000,
                validateStatus: () => true
            });

            if (response.status === 200 && response.data) {
                const incidents = this.parseEmergencyIncidents(response.data);
                this.activeIncidents.fires = incidents.fires;
                this.activeIncidents.floods = incidents.floods;

                console.log(`🔥 Found ${this.activeIncidents.fires.length} fire incidents`);
                console.log(`💧 Found ${this.activeIncidents.floods.length} flood incidents`);

                if (incidents.fires.length > 0) {
                    this.emit('fires_updated', this.activeIncidents.fires);
                }
                if (incidents.floods.length > 0) {
                    this.emit('floods_updated', this.activeIncidents.floods);
                }
            } else {
                // Simulate emergency incidents for demo
                const incidents = this.simulateEmergencyIncidents();
                this.activeIncidents.fires = incidents.fires;
                this.activeIncidents.floods = incidents.floods;
            }

        } catch (error) {
            console.error('Emergency incident check failed:', error.message);
            // Use simulated data as fallback
            const incidents = this.simulateEmergencyIncidents();
            this.activeIncidents.fires = incidents.fires;
            this.activeIncidents.floods = incidents.floods;
        }
    }

    /**
     * Analyze tower impacts from all incidents
     */
    analyzeTowerImpacts() {
        const impactedTowers = [];

        this.towers.forEach(tower => {
            const impacts = {
                tower: tower,
                incidents: [],
                severity: 'none'
            };

            // Check NBN outages
            this.activeIncidents.nbn.forEach(outage => {
                if (this.isWithinRadius(tower.latitude, tower.longitude, outage.latitude, outage.longitude, tower.radius)) {
                    impacts.incidents.push({
                        type: 'nbn',
                        severity: outage.severity,
                        description: outage.description,
                        distance: this.calculateDistance(tower.latitude, tower.longitude, outage.latitude, outage.longitude)
                    });
                }
            });

            // Check power outages
            this.activeIncidents.power.forEach(outage => {
                if (this.isWithinRadius(tower.latitude, tower.longitude, outage.latitude, outage.longitude, tower.radius)) {
                    impacts.incidents.push({
                        type: 'power',
                        severity: outage.severity,
                        description: outage.description,
                        affectedCustomers: outage.affectedCustomers,
                        distance: this.calculateDistance(tower.latitude, tower.longitude, outage.latitude, outage.longitude)
                    });
                }
            });

            // Check fires
            this.activeIncidents.fires.forEach(fire => {
                if (this.isWithinRadius(tower.latitude, tower.longitude, fire.latitude, fire.longitude, tower.radius)) {
                    impacts.incidents.push({
                        type: 'fire',
                        severity: fire.severity,
                        description: fire.description,
                        distance: this.calculateDistance(tower.latitude, tower.longitude, fire.latitude, fire.longitude)
                    });
                }
            });

            // Check floods
            this.activeIncidents.floods.forEach(flood => {
                if (this.isWithinRadius(tower.latitude, tower.longitude, flood.latitude, flood.longitude, tower.radius)) {
                    impacts.incidents.push({
                        type: 'flood',
                        severity: flood.severity,
                        description: flood.description,
                        distance: this.calculateDistance(tower.latitude, tower.longitude, flood.latitude, flood.longitude)
                    });
                }
            });

            // Determine overall severity
            if (impacts.incidents.length > 0) {
                impacts.severity = this.determineOverallSeverity(impacts.incidents);
                impactedTowers.push(impacts);
            }
        });

        if (impactedTowers.length > 0) {
            console.log(`⚠️  ${impactedTowers.length} towers impacted by incidents`);
            this.emit('tower_impacts', impactedTowers);

            // Send alerts for high/critical severity
            impactedTowers.forEach(impact => {
                if (impact.severity === 'critical' || impact.severity === 'high') {
                    this.emit('critical_tower_alert', impact);
                }
            });
        }

        return impactedTowers;
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Check if point is within radius
     */
    isWithinRadius(lat1, lon1, lat2, lon2, radiusKm) {
        return this.calculateDistance(lat1, lon1, lat2, lon2) <= radiusKm;
    }

    /**
     * Determine overall severity from multiple incidents
     */
    determineOverallSeverity(incidents) {
        const severityLevels = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
        let maxSeverity = 0;

        incidents.forEach(incident => {
            const level = severityLevels[incident.severity] || 0;
            if (level > maxSeverity) {
                maxSeverity = level;
            }
        });

        const reverseLookup = { 4: 'critical', 3: 'high', 2: 'medium', 1: 'low', 0: 'none' };
        return reverseLookup[maxSeverity];
    }

    /**
     * Simulate NBN outages (for demo purposes)
     */
    simulateNBNOutages() {
        const perthLocations = [
            { suburb: 'Perth CBD', lat: -31.9505, lon: 115.8605 },
            { suburb: 'Fremantle', lat: -32.0569, lon: 115.7439 },
            { suburb: 'Joondalup', lat: -31.7448, lon: 115.7661 }
        ];

        return perthLocations.slice(0, Math.floor(Math.random() * 2)).map(location => ({
            id: `nbn_${Date.now()}_${Math.random()}`,
            type: 'nbn',
            description: `NBN outage in ${location.suburb}`,
            suburb: location.suburb,
            latitude: location.lat,
            longitude: location.lon,
            severity: Math.random() > 0.7 ? 'high' : 'medium',
            affectedServices: Math.floor(Math.random() * 500) + 100,
            estimatedRestoration: new Date(Date.now() + Math.random() * 7200000).toISOString(),
            reportedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
        }));
    }

    /**
     * Simulate power outages (for demo purposes)
     */
    simulatePowerOutages() {
        const perthLocations = [
            { suburb: 'Subiaco', lat: -31.9481, lon: 115.8247 },
            { suburb: 'Rockingham', lat: -32.2772, lon: 115.7297 },
            { suburb: 'Midland', lat: -31.8908, lon: 116.0135 }
        ];

        return perthLocations.slice(0, Math.floor(Math.random() * 2)).map(location => ({
            id: `power_${Date.now()}_${Math.random()}`,
            type: 'power',
            description: `Power outage in ${location.suburb}`,
            suburb: location.suburb,
            latitude: location.lat,
            longitude: location.lon,
            severity: Math.random() > 0.8 ? 'critical' : 'high',
            affectedCustomers: Math.floor(Math.random() * 1000) + 200,
            cause: ['Equipment failure', 'Planned maintenance', 'Weather event'][Math.floor(Math.random() * 3)],
            estimatedRestoration: new Date(Date.now() + Math.random() * 10800000).toISOString(),
            reportedAt: new Date(Date.now() - Math.random() * 7200000).toISOString()
        }));
    }

    /**
     * Simulate emergency incidents (for demo purposes)
     */
    simulateEmergencyIncidents() {
        const fires = Math.random() > 0.8 ? [{
            id: `fire_${Date.now()}`,
            type: 'fire',
            description: 'Bushfire - Watch and Act',
            location: 'Darling Range',
            latitude: -32.0667,
            longitude: 116.0667,
            severity: 'high',
            status: 'active',
            reportedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
        }] : [];

        const floods = Math.random() > 0.9 ? [{
            id: `flood_${Date.now()}`,
            type: 'flood',
            description: 'Flash Flood Warning',
            location: 'Swan Valley',
            latitude: -31.8561,
            longitude: 116.0106,
            severity: 'medium',
            status: 'active',
            reportedAt: new Date(Date.now() - Math.random() * 1800000).toISOString()
        }] : [];

        return { fires, floods };
    }

    /**
     * Parse NBN outage data
     */
    parseNBNOutages(data) {
        // Parse actual API response when available
        return data.outages || [];
    }

    /**
     * Parse power outage data
     */
    parsePowerOutages(data) {
        // Parse actual API response when available
        return data.outages || [];
    }

    /**
     * Parse emergency incident data
     */
    parseEmergencyIncidents(data) {
        // Parse actual API response when available
        return {
            fires: data.fires || [],
            floods: data.floods || []
        };
    }

    /**
     * Get all active incidents
     */
    getAllIncidents() {
        return {
            nbn: this.activeIncidents.nbn,
            power: this.activeIncidents.power,
            fires: this.activeIncidents.fires,
            floods: this.activeIncidents.floods,
            towers: this.towers,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('🛑 Australian Infrastructure Service stopped');
    }
}

module.exports = AustralianInfrastructureService;
