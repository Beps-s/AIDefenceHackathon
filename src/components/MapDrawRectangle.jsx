import { useRef, useState, useEffect, createRef } from "react";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  useMap,
  Circle,
  Tooltip,
  Polygon,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import MiniMapControl from "./MiniMapControl";
import leafletImage from "leaflet-image";
import SymbolMarker from "./extended/SymbolMarker";
import MilitaryAttackArrow from "./extended/MilitaryAttackArrow";
import {
  postQuery,
  constructQuery,
  snapJsonCoordinates,
} from "../api/overpassApi.ts";
import { centroid, getRandomPointsInPolygon } from "../util.ts";
import exampleData from "../assets/example.json";
import openaiApi from "../api/openaiApi.ts";
import meteoApi from "../api/meteoApi.ts";

//const elevation = meteoApi.getElevetion([58.6315855, 25.020831]);

const MiniMapWrapper = () => {
  const map = useMap();
  return <MiniMapControl map={map} />;
};

const MapDrawRectangle = () => {
  const [map, setMap] = useState(null);
  const featureGroupRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [geoJson, setGeoJson] = useState(null);
  const [roadData, setRoadData] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [featureData, setFeatureData] = useState(null);
  const [aiResponse, setAIResponse] = useState(null);

  const apiRequest = async () => {
    setLoading(true);
    const response = await openaiApi.getResponse(croppedImage, imageSize);
    setAIResponse(response);
    setLoading(false);
  };

  const getRoadData = async () => {
    if (geoJson) {
      setLoading(true);
      //setFeatureData(exampleData);
      let string = "";
      geoJson.geometry.coordinates[0].map((group) => {
        string += ` ${group[1]}`;
        string += ` ${group[0]}`;
      });

      const response = await postQuery(constructQuery(string));
      setRoadData(response);
      setLoading(false);
      featureGroupRef.current.clearLayers();
    }
  };

  useEffect(() => {
    if (croppedImage && imageSize) {
      //const randomHeightPoints = meteoApi.getElevetion(getRandomPointsInPolygon(geoJson.geometry.coordinates, 4));
      apiRequest();
    }
  }, [croppedImage, imageSize]);

  // on geojson state change
  useEffect(() => {
    if (geoJson && !roadData) {
      getRoadData();
    }

    if (aiResponse) {
      setFeatureData(aiResponse);
    }
  }, [geoJson, aiResponse]);

  const parseTacticalJson = () => {
    const features = [];
    featureData.map((feature, index) => {
      if (feature.type === "LINE" || feature.type === "ARROW")
        features.push(
          <MilitaryAttackArrow
            key={`${index} ${feature.text}`}
            positions={feature.coordinates}
            weight={0.5}
            text={feature.text}
          />
        );
      if (feature.type === "POLYGON")
        features.push(
          <Polygon
            key={`${index} ${feature.text}`}
            positions={feature.coordinates}
            color="blue"
          >
            {feature.symbol ? (
              <SymbolMarker
                position={centroid(feature.coordinates)}
                code={feature.symbol}
              />
            ) : null}
            <Tooltip className="feature-text" direction="center">
              <span>{feature.text}</span>
            </Tooltip>
          </Polygon>
        );
      if (feature.type === "CIRCLE")
        features.push(
          <Circle
            key={`${index} ${feature.text}`}
            center={feature.coordinates}
            radius={feature.radius}
            text="test"
          >
            {feature.symbol ? (
              <SymbolMarker
                position={feature.coordinates}
                code={feature.symbol}
              />
            ) : null}
            <Tooltip className="feature-text" direction="center">
              <span>{feature.text}</span>
            </Tooltip>
          </Circle>
        );
      if (feature.type === "SYMBOL")
        features.push(
          <SymbolMarker
            key={`${index} ${feature.name}`}
            position={feature.coordinate}
            text={feature.text}
            code={feature.code}
          />
        );
    });
    return features;
  };

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

      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = width;
      croppedCanvas.height = height;

      const ctx = croppedCanvas.getContext("2d");
      ctx.drawImage(
        canvas,
        topLeft.x,
        topLeft.y,
        width,
        height,
        0,
        0,
        width,
        height
      );

      const croppedImageDataURL = croppedCanvas.toDataURL("image/png");
      setCroppedImage(croppedImageDataURL);

      // Get pixel size of cropped image
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = croppedImageDataURL;
    });
  };

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      {!roadData ? (
        <div style={{
            width: "100%",
            position: "absolute",
            display: "flex",
            justifyContent: "center",
        }}>
        <h2
          style={{
            zIndex: 1000,
            background: "white",
            padding: "0.5em",
            borderRadius: "4px",
            boxShadow: "0 0 8px black",
            textAlign: "center",
          }}
        >
          {loading ? "Analyzing..." : "Select an area"}
        </h2>
        </div>
      ) : null}
      <MapContainer
        loading={loading}
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
        ref={setMap}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          minZoom={14}
          maxZoom={16}
        />
        {featureData ? parseTacticalJson() : null}
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
      {/*
      <pre
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          zIndex: 1000,
          maxWidth: "30vw",
          maxHeight: "30vh",
          overflow: "auto",
          background: "#f4f4f4",
          padding: "1em",
          borderRadius: "4px",
        }}
      >
        {geoJson
          ? JSON.stringify(geoJson, null, 2)
          : "Draw a rectangle to get GeoJSON here."}
      </pre>
      */}

      {imageSize && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: "38%",
            zIndex: 1000,
            background: "rgba(255,255,255,0.8)",
            boxShadow: "0 0 4px gray",
            padding: "0.5em 1em",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          Cropped Image Size: {imageSize.width} x {imageSize.height} px
        </div>
      )}

      {croppedImage && (
        <a
          href={croppedImage}
          download="cropped-map.png"
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#007bff",
            color: "white",
            padding: "0.5em 1em",
            borderRadius: "6px",
            textDecoration: "none",
            zIndex: 1000,
          }}
        >
          Download Cropped Image
        </a>
      )}
    </div>
  );
};

export default MapDrawRectangle;
