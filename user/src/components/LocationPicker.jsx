import { useEffect, useRef, useState } from "react";

export default function LocationPicker({ value, onSelect }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const searchInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.google) return;

    geocoderRef.current = new window.google.maps.Geocoder();

    const defaultCenter = { lat: 12.9141, lng: 74.8560 }; // fallback: Mangaluru

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      disableDefaultUI: false,
      streetViewControl: false,
      mapTypeControl: false,
    });

    markerRef.current = new window.google.maps.Marker({
      map: mapInstance.current,
      position: defaultCenter,
      draggable: true,
    });

    // Reverse geocode whenever marker is dragged
    markerRef.current.addListener("dragend", () => {
      const pos = markerRef.current.getPosition();
      reverseGeocode(pos.lat(), pos.lng());
    });

    // Click on map to move marker
    mapInstance.current.addListener("click", (e) => {
      markerRef.current.setPosition(e.latLng);
      reverseGeocode(e.latLng.lat(), e.latLng.lng());
    });

    // Places autocomplete on search box
    if (searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        { fields: ["geometry", "formatted_address"] }
      );
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;
        const loc = place.geometry.location;
        mapInstance.current.setCenter(loc);
        mapInstance.current.setZoom(17);
        markerRef.current.setPosition(loc);
        onSelect(place.formatted_address);
      });
    }

    // Try current location on mount
    locateMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = (lat, lng) => {
    setLoading(true);
    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      setLoading(false);
      if (status === "OK" && results[0]) {
        onSelect(results[0].formatted_address);
      } else {
        onSelect(`Lat ${lat.toFixed(5)}, Long ${lng.toFixed(5)}`);
      }
    });
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const center = { lat: latitude, lng: longitude };
        mapInstance.current.setCenter(center);
        mapInstance.current.setZoom(17);
        markerRef.current.setPosition(center);
        reverseGeocode(latitude, longitude);
      },
      () => setLoading(false)
    );
  };

  return (
    <div className="location-picker">
      <div className="location-input-group">
        <input
          ref={searchInputRef}
          type="text"
          className="form-input"
          placeholder="Search address, or click/drag on map..."
          defaultValue={value}
        />
        <button type="button" className="gps-btn" onClick={locateMe}>
          <span>{loading ? "Locating..." : "Use Current"}</span>
        </button>
      </div>
      <div
        ref={mapRef}
        style={{ width: "100%", height: "220px", borderRadius: "10px", marginTop: "8px" }}
      />
    </div>
  );
}