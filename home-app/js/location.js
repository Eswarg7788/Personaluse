/* ============================
   Location-Based Reminders
   ============================ */
const Location = (() => {
    let watchId = null;
    let savedLocations = [];

    function init() {
        savedLocations = App.getData('savedLocations');
        if (!savedLocations.length) {
            savedLocations = [
                { id: 'home', name: 'Home', lat: 0, lng: 0 },
                { id: 'office', name: 'Office', lat: 0, lng: 0 }
            ];
        }
    }

    function getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                err => reject(err),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    async function captureCurrentLocation(nameInputId) {
        try {
            App.showToast('Getting location...', 'info');
            const pos = await getCurrentPosition();
            const locName = document.getElementById(nameInputId)?.value || 'My Location';

            // Save location
            const locations = App.getData('savedLocations');
            const existing = locations.find(l => l.name === locName);
            if (existing) {
                existing.lat = pos.lat;
                existing.lng = pos.lng;
            } else {
                locations.push({ id: App.generateId(), name: locName, lat: pos.lat, lng: pos.lng });
            }
            App.setData('savedLocations', locations);
            savedLocations = locations;

            App.showToast(`Location saved: ${locName}`, 'success');
            populateLocationSelect();
            return pos;
        } catch (err) {
            App.showToast('Could not get location. Check permissions.', 'error');
            return null;
        }
    }

    function populateLocationSelect() {
        const sel = document.getElementById('reminderLocation');
        if (!sel) return;
        const locations = App.getData('savedLocations');
        sel.innerHTML = '<option value="">No location</option>';
        locations.forEach(l => {
            if (l.lat !== 0 || l.lng !== 0) {
                sel.innerHTML += `<option value="${l.id}">${l.name}</option>`;
            }
        });
    }

    function startProximityWatch() {
        if (!navigator.geolocation || watchId) return;
        watchId = navigator.geolocation.watchPosition(
            pos => checkProximity(pos.coords.latitude, pos.coords.longitude),
            () => {},
            { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 }
        );
    }

    function stopProximityWatch() {
        if (watchId && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
    }

    function checkProximity(lat, lng) {
        const reminders = App.getData('reminders');
        const locations = App.getData('savedLocations');
        const notified = JSON.parse(sessionStorage.getItem('loc_notified') || '[]');

        reminders.forEach(r => {
            if (!r.locationId || r.status === 'completed' || notified.includes(r.id)) return;
            const loc = locations.find(l => l.id === r.locationId);
            if (!loc || (loc.lat === 0 && loc.lng === 0)) return;

            const dist = haversineDistance(lat, lng, loc.lat, loc.lng);
            if (dist < 0.5) { // Within 500 meters
                App.showToast(`📍 Near ${loc.name}: ${r.title}`, 'warning');
                notified.push(r.id);
                sessionStorage.setItem('loc_notified', JSON.stringify(notified));

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`📍 Near ${loc.name}`, { body: r.title, icon: 'icons/icon-192.png' });
                }
            }
        });
    }

    function haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function getLocationName(locId) {
        if (!locId) return '';
        const locations = App.getData('savedLocations');
        const loc = locations.find(l => l.id === locId);
        return loc ? loc.name : '';
    }

    document.addEventListener('DOMContentLoaded', () => {
        init();
        setTimeout(() => {
            populateLocationSelect();
            startProximityWatch();
        }, 2000);
    });

    return { captureCurrentLocation, populateLocationSelect, getLocationName, startProximityWatch, stopProximityWatch };
})();
