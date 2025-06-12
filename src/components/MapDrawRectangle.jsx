import { useRef, useState } from "react";
import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

const MapDrawRectangle = () => {
  const featureGroupRef = useRef(null);
  const [geoJson, setGeoJson] = useState(null);

  const handleCreated = (e) => {
    const { layer } = e;
    const drawnItems = featureGroupRef.current;
    drawnItems.clearLayers();
    drawnItems.addLayer(layer);
    setGeoJson(layer.toGeoJSON());
  };

  return (
    <div>
      <h2>Draw a Rectangle</h2>
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: "500px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            draw={{
              rectangle: false,
              polyline: false,
              polygon: false,
              circle: false,
              circlemarker: false,
              marker: false,
            }}
            edit={{
              edit: false,
              remove: false,
            }}
          />
        </FeatureGroup>
      </MapContainer>
      <pre style={{ marginTop: "1em", background: "#f4f4f4", padding: "1em" }}>
        {geoJson
          ? JSON.stringify(geoJson, null, 2)
          : "Draw a rectangle to get GeoJSON here."}
      </pre>
    </div>
  );
};

export default MapDrawRectangle;
