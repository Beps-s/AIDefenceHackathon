// MiniMapControl.js
import { useEffect } from "react";
import L from "leaflet";
import "leaflet-minimap/dist/Control.MiniMap.min.css";
import "leaflet-minimap";


const MiniMapControl = ({ map }) => {
    useEffect(() => {
        if (!map) return;

        const miniLayer = new L.TileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            minZoom: 0,
            maxZoom: 13,
        });

        const miniMap = new L.Control.MiniMap(miniLayer, {
            toggleDisplay: true,
            minimized: false,
            position: "bottomright",
        });


        miniMap.addTo(map);

        return () => {
            miniMap.remove();
        };
    }, [map]);

    return null;
};

export default MiniMapControl;
