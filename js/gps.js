/**
 * GPS Tracking en Afstandsberekening voor Golfclub Zeegersloot
 */

const COURSE_DATA_GPS = typeof COURSE_INFO !== 'undefined' 
  ? COURSE_INFO 
  : (typeof window !== 'undefined' && window.COURSE_INFO 
      ? window.COURSE_INFO 
      : (typeof require !== 'undefined' ? require('./course-data.js') : {}));

const GPSManager = (typeof window !== 'undefined' ? window.GPSManager = {} : {});
Object.assign(GPSManager, {
  currentPosition: null,
  watchId: null,
  listeners: [],
  status: 'idle', // 'idle' | 'locating' | 'active' | 'error' | 'denied'
  errorMessage: '',

  /**
   * Start GPS tracking via Geolocation API
   */
  startTracking() {
    if (!('geolocation' in navigator)) {
      this.status = 'error';
      this.errorMessage = 'GPS wordt niet ondersteund door je browser';
      this.notifyListeners();
      return;
    }

    this.status = 'locating';
    this.notifyListeners();

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000
    };

    // Eenmalig direct opvragen
    navigator.geolocation.getCurrentPosition(
      (pos) => this.handlePositionUpdate(pos),
      (err) => this.handleError(err),
      options
    );

    // Continue tracking
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handlePositionUpdate(pos),
      (err) => this.handleError(err),
      options
    );
  },

  /**
   * Stop tracking (bijv. bij afsluiten)
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.status = 'idle';
    this.notifyListeners();
  },

  handlePositionUpdate(pos) {
    this.currentPosition = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      accuracy: Math.round(pos.coords.accuracy || 0),
      timestamp: pos.timestamp
    };
    this.status = 'active';
    this.errorMessage = '';
    this.notifyListeners();
  },

  handleError(err) {
    if (err.code === 1) { // PERMISSION_DENIED
      this.status = 'denied';
      this.errorMessage = 'GPS toegang geweigerd in browserinstellingen';
    } else {
      this.status = 'error';
      this.errorMessage = 'Kon GPS signaal niet bepalen';
    }
    this.notifyListeners();
  },

  subscribe(callback) {
    this.listeners.push(callback);
    // Direct huidige staat doorgeven
    callback(this.getGPSState());
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },

  notifyListeners() {
    const state = this.getGPSState();
    this.listeners.forEach(cb => {
      try {
        cb(state);
      } catch (e) {
        console.error('Error in GPS listener', e);
      }
    });
  },

  getGPSState() {
    return {
      status: this.status,
      position: this.currentPosition,
      errorMessage: this.errorMessage
    };
  },

  /**
   * Haversine afstandsformule in meters
   */
  calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Aardstraal in meters
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  },

  /**
   * Bereken alle relevante afstanden voor de huidige en volgende hole
   */
  getHoleDistances(currentHoleNumber) {
    const currentHole = COURSE_DATA_GPS.holes.find(h => h.number === currentHoleNumber);
    const nextHoleNumber = currentHoleNumber < COURSE_DATA_GPS.totalHoles ? currentHoleNumber + 1 : null;
    const nextHole = nextHoleNumber ? COURSE_DATA_GPS.holes.find(h => h.number === nextHoleNumber) : null;

    const result = {
      currentHoleNumber,
      nextHoleNumber,
      hasGPS: this.status === 'active' && !!this.currentPosition,
      accuracy: this.currentPosition?.accuracy || null,
      
      // Huidige hole
      toCurrentGreen: null,
      toCurrentTee: null,

      // Volgende hole
      toNextTee: null,
      toNextGreen: null,
      nextHoleCardLength: nextHole ? nextHole.distances.geel : null
    };

    if (this.currentPosition && this.status === 'active') {
      const { lat, lon } = this.currentPosition;

      if (currentHole) {
        if (currentHole.green) {
          result.toCurrentGreen = this.calculateDistanceMeters(lat, lon, currentHole.green.lat, currentHole.green.lon);
        }
        if (currentHole.tee) {
          result.toCurrentTee = this.calculateDistanceMeters(lat, lon, currentHole.tee.lat, currentHole.tee.lon);
        }
      }

      if (nextHole) {
        if (nextHole.tee) {
          result.toNextTee = this.calculateDistanceMeters(lat, lon, nextHole.tee.lat, nextHole.tee.lon);
        }
        if (nextHole.green) {
          result.toNextGreen = this.calculateDistanceMeters(lat, lon, nextHole.green.lat, nextHole.green.lon);
        }
      }
    }

    return result;
  }
});
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GPSManager;
}
