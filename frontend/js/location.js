// Location acquisition & nearby map service utilities

const LocationHandler = {
  currentCoords: null,

  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          resolve(this.currentCoords);
        },
        (error) => {
          let msg = "Could not obtain location.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Location access was denied. Please allow location permissions in your browser.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Location information is currently unavailable.";
          } else if (error.code === error.TIMEOUT) {
            msg = "Location acquisition timed out.";
          }
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  },

  getMapLink(lat, lng) {
    if (!lat || !lng) return "#";
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
};
