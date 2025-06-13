import { useRef, useState } from "react";
import { MapContainer, TileLayer, FeatureGroup, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import MiniMapControl from "./MiniMapControl";
import leafletImage from "leaflet-image";


const MiniMapWrapper = () => {
    const map = useMap();
    return <MiniMapControl map={map} />;
};

const MapDrawRectangle = () => {
    const featureGroupRef = useRef(null);
    const [geoJson, setGeoJson] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);

    const handleCreated = (e) => {
        const { layer } = e;
        const drawnItems = featureGroupRef.current;
        drawnItems.clearLayers();
        drawnItems.addLayer(layer);
        const geoJson = layer.toGeoJSON();
        setGeoJson(geoJson);

        const bounds = layer.getBounds();
        const map = layer._map;
        leafletImage(map, function (err, canvas) {
            if (err) {
                return;
            }

            const topLeft = map.latLngToContainerPoint(bounds.getNorthWest());
            const bottomRight = map.latLngToContainerPoint(bounds.getSouthEast());

            const width = bottomRight.x - topLeft.x;
            const height = bottomRight.y - topLeft.y;

            // Create an offscreen canvas to crop the selected area
            const croppedCanvas = document.createElement("canvas");
            croppedCanvas.width = width;
            croppedCanvas.height = height;

            const ctx = croppedCanvas.getContext("2d");
            ctx.drawImage(
                canvas,
                topLeft.x, topLeft.y, width, height, // source
                0, 0, width, height                  // destination
            );

            const croppedImageDataURL = croppedCanvas.toDataURL("image/png");

            console.log("🖼️ Cropped Image Data URL:", croppedImageDataURL);
            setCroppedImage(croppedImageDataURL);
        });
    };


    return (
        <div style={{ height: "100vh", width: "100vw" }}>
            <h2 style={{ position: "absolute", zIndex: 1000, margin: 10, background: "white", padding: "0.5em", borderRadius: "4px" }}>
                Draw a Rectangle
            </h2>
            <MapContainer
                zoom={14}
                style={{ height: "100%", width: "100%" }}
                maxBounds={[
                    [57.5, 21.5],
                    [59.9, 28.3],
                ]}
                center={[58.5953, 25.0136]}
                maxBoundsViscosity={1.0}
                minZoom={14}
                maxZoom={16}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                    minZoom={14}
                    maxZoom={16}
                />
                <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                        position="topright"
                        onCreated={handleCreated}
                        draw={{
                            rectangle: true,
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
                <MiniMapWrapper />
            </MapContainer>
            <pre style={{
                position: "absolute",
                bottom: 10,
                left: 10,
                zIndex: 1000,
                maxWidth: "30vw",
                maxHeight: "30vh",
                overflow: "auto",
                background: "#f4f4f4",
                padding: "1em",
                borderRadius: "4px"
            }}>
                {geoJson ? JSON.stringify(geoJson, null, 2) : "Draw a rectangle to get GeoJSON here."}
            </pre>
        </div>
    );
};

export default MapDrawRectangle;
