export class GeoDrawManager {
    constructor(mapInstance, drawBtnId, minInputId, maxInputId) {
        this.map = mapInstance;
        this.btn = document.getElementById(drawBtnId);
        this.minInput = document.getElementById(minInputId);
        this.maxInput = document.getElementById(maxInputId);
        this.layer = null;
        this.active = false;
        this.clicks = 0;
        this.anchorLatLng = null;
    }

    init() {
        if (!this.btn || !this.map) return;
        this.btn.addEventListener('click', () => this.toggleMode());
        this.map.on('click', (e) => this.handleMapClick(e));
    }

    toggleMode() {
        this.active = !this.active;
        this.clicks = 0;
        if (this.active) {
            this.btn.innerText = "🚨 Drag & Click Opposite Corner";
            this.btn.classList.replace('bg-indigo-600/20', 'bg-amber-600/40');
            this.map.dragging.disable();
            L.DomUtil.addClass(this.map._container, 'draw-mode-crosshair');
        } else {
            this.resetState();
        }
    }

    resetState() {
        this.active = false;
        this.btn.innerText = "[┼] Intercept Bounding Box Tool";
        this.btn.classList.replace('bg-amber-600/40', 'bg-indigo-600/20');
        this.map.dragging.enable();
        L.DomUtil.removeClass(this.map._container, 'draw-mode-crosshair');
        this.map.off('mousemove');
    }

    handleMapClick(e) {
        if (!this.active) return;
        this.clicks++;

        if (this.clicks === 1) {
            this.anchorLatLng = e.latlng;
            this.map.on('mousemove', (moveEvt) => {
                if (this.layer) this.map.removeLayer(this.layer);
                this.layer = L.rectangle([this.anchorLatLng, moveEvt.latlng], {
                    color: "#6366f1", weight: 2, fillColor: "#6366f1", fillOpacity: 0.15
                }).addTo(this.map);
            });
        } else if (this.clicks === 2) {
            this.map.off('mousemove');
            const minLat = Math.min(this.anchorLatLng.lat, e.latlng.lat);
            const maxLat = Math.max(this.anchorLatLng.lat, e.latlng.lat);
            const minLon = Math.min(this.anchorLatLng.lng, e.latlng.lng);
            const maxLon = Math.max(this.anchorLatLng.lng, e.latlng.lng);

            this.minInput.value = `${minLat.toFixed(4)}, ${minLon.toFixed(4)}`;
            this.maxInput.value = `${maxLat.toFixed(4)}, ${maxLon.toFixed(4)}`;
            
            if (this.layer) this.map.removeLayer(this.layer);
            this.layer = L.rectangle([[minLat, minLon], [maxLat, maxLon]], { 
                color: "#6366f1", weight: 2, fillColor: "#6366f1", fillOpacity: 0.1 
            }).addTo(this.map);
            this.resetState();
        }
    }
}