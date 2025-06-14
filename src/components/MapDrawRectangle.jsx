import { useRef, useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  useMap,
  Circle,
  Tooltip,
  Polygon,
  Polyline,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import MiniMapControl from "./MiniMapControl";
import leafletImage from "leaflet-image";
import L from "leaflet";
import SymbolMarker from "./extended/SymbolMarker";
import MilitaryAttackArrow from "./extended/MilitaryAttackArrow";
import { postQuery, constructQuery, snapJsonCoordinates } from "../api/overpassApi.ts";
import { centroid } from "../util.ts";
import exampleData from "../assets/example.json";

const MiniMapWrapper = () => {
  const map = useMap();
  return <MiniMapControl map={map} />;
};

const MapDrawRectangle = () => {
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const featureGroupRef = useRef(null);
  const [geoJson, setGeoJson] = useState(null);
  const [queryData, setQueryData] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [featureData, setFeatureData] = useState(null);

  const [response, setResponse] = useState(null);

  const apiRequest = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer `,
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          messages: [
            {
              role: "system",
              content: `Act as a military terrain analysis expert specializing in the OCOKA framework. Your primary task is to analyze imagery provided by the user and output relevant OCOKA features as structured JSON objects.
OCOKA stands for:
- Observation and Fields of Fire
- Cover and Concealment
- Obstacles (man-made and natural)
- Key Terrain
- Avenues of Approach

You do not return a written OCOKA report, but instead extract and convert the visual and spatial information into structured coordinate-based outputs. The map or image you receive may contain terrain markings, symbols, or features relevant to military analysis. You must interpret these and generate a JSON array, where each entry describes a feature with:
- type (e.g. SYMBOL, ARROW, CIRCLE, POLYGON, LINE)
- coordinate or coordinates in the format [latitude, longitude]
- optional properties like radius for circular features

Avoid assumptions about terrain features—only describe elements that are clearly visible or explicitly indicated. Emphasize identifying and annotating avenues of approach and key terrain.

Limit the output to **a maximum of 2 avenues of approach**, both originating from the **same general direction** (quarter), targeting the **main key terrain feature** — the one whose loss would be most detrimental. All analysis and justification should center on **targeting that single critical key terrain point**.

Image resolution: ${imageSize.width} (X axis, left-to-right) × ${imageSize.height} (Y axis, top-to-bottom)
Geographic anchors:
   – Top-left pixel (0, 0):   lat 58.613028   lon 24.971329  
   – Bottom-right pixel (1166, 809): lat 58.576800   lon 25.071513  

Pre-computed deltas (use verbatim – dont round):  
   Δlat = 58.576800 – 58.613028 = -0.036228  
   Δlon = 25.071513 – 24.971329 = +0.100184  

Conversion formula for any pixel position (x, y):  
   lat = 58.613028 + (y / 810) · (-0.036228)  
   lon = 24.971329 + (x / 1167)· (+0.100184)  

To calculate the coordinates please use linear interpolation using the bounds you are given.
Y increases southward; X increases eastward.  

When determining key terrain, consider any terrain feature (natural or manmade) which, if controlled, provides a marked advantage. Key terrain may:
- Serve as objectives or battle positions
- Be echelon, mission, or enemy-situation dependent
- Be controlled via fires or maneuver, not necessarily occupied

Prioritize clarity, precision, and correct OCOKA categorization for every feature you describe. Use correct military terminology and retain accurate coordinates.

Your OCOKA responsibilities include:

**Observation and Fields of Fire**
- Identify elevated positions or clear lines of sight.
- Mark observation posts or firing lines using type: SYMBOL or type: ARROW.
- Analyze visibility (line-of-sight), high ground, and dominant positions.
- Describe environmental conditions (e.g., weather, lighting) impacting observation.

**Cover and Concealment**
- Detect natural (e.g., forests, ditches) or artificial (e.g., buildings, walls) areas providing protection.
- Represent these with type: CIRCLE or type: POLYGON.
- Consider variability across movement routes or times of day.

**Obstacles**
- Highlight natural (e.g., rivers, ravines) and man-made (e.g., fences, minefields) barriers to movement.
- Mark with type: POLYGON or type: LINE.
- Differentiate between existing, reinforcing, and concealed obstacles.
- Consider how obstacles may be used offensively or defensively.

**Key Terrain**
- Identify positions offering tactical advantage if controlled.
- Use type: SYMBOL with "text": "Key Terrain" and include a concise justification.
- Consider effects on movement, communications, supply, and command.
- Include decisive terrain essential to mission success.

**Avenues of Approach**
- Outline **no more than 2 viable paths**, both **originating from the same quarter** (e.g. NW, NE, etc).
- Represent with type: ARROW and multiple coordinates indicating direction.
- Ensure both paths converge or focus on the **primary key terrain point**.
- Evaluate terrain for different unit types (infantry, mechanized).
- Include mobility corridors, chokepoints, ambush points, and flanking routes.

Use geographic and tactical terminology with precision. Minimize textual explanations and focus on detailed, justified JSON output for each clearly visible feature.

**Coordinate Format Requirement:**
- All coordinate outputs must use the format [latitude, longitude] (e.g., [58.592, 25.002]).`,
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${croppedImage}`,
                    detail: "high",
                  },
                },
              ],
            },
          ],
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setResponse(data);
      console.log("API response:", data);
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getRoadData = async () => {
    if (geoJson) {
      let string = "";
      geoJson.geometry.coordinates[0].map((group) => {
        string += ` ${group[1]}`;
        string += ` ${group[0]}`;
      });

      const response = await postQuery(constructQuery(string));
      setQueryData(response);
    }
  };

  // on geojson state change
  useEffect(() => {
    if (geoJson) {
      getRoadData();
      setFeatureData(exampleData);
    }
  }, [geoJson]);

  const parseTacticalJson = () => {
    if (featureData == null) return;
    const features = [];
    featureData.map((feature, index) => {
      if (feature.type === "LINE" || feature.type === "ARROW")
        features.push(
          <MilitaryAttackArrow
            key={`${index} ${feature.text}`}
            positions={snapJsonCoordinates(map, queryData, feature.coordinates)}
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
            center={feature.coordinate}
            radius={feature.radius}
            text="test"
          >
            {feature.symbol ? (
              <SymbolMarker
                position={feature.coordinate}
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

      // --- Draw grid lines every 2000 meters ---
      const coords = geoJson.geometry.coordinates[0];
      const lats = coords.map((c) => c[1]);
      const lngs = coords.map((c) => c[0]);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const crs = map.options.crs;

      const southWest = crs.project(L.latLng(minLat, minLng));
      const northEast = crs.project(L.latLng(maxLat, maxLng));

      const spacing = 2000; // meters grid spacing

      // Vertical lines at every spacing meters (x values)
      const verticalLines = [];
      for (let x = southWest.x; x <= northEast.x; x += spacing) {
        verticalLines.push(x);
      }

      // Horizontal lines at every spacing meters (y values)
      const horizontalLines = [];
      for (let y = southWest.y; y <= northEast.y; y += spacing) {
        horizontalLines.push(y);
      }

      // Convert vertical lines to latLng pairs (bottom to top)
      const verticalLatLngLines = verticalLines.map((x) => [
        crs.unproject(L.point(x, southWest.y)),
        crs.unproject(L.point(x, northEast.y)),
      ]);

      // Convert horizontal lines to latLng pairs (left to right)
      const horizontalLatLngLines = horizontalLines.map((y) => [
        crs.unproject(L.point(southWest.x, y)),
        crs.unproject(L.point(northEast.x, y)),
      ]);

      // Helper: convert latLng line to pixel points relative to crop
      function latLngLineToPixel(line) {
        return line.map((latlng) => map.latLngToContainerPoint(latlng));
      }

      const verticalPixelLines = verticalLatLngLines.map((line) => {
        const pts = latLngLineToPixel(line);
        return pts.map((p) => ({ x: p.x - topLeft.x, y: p.y - topLeft.y }));
      });

      const horizontalPixelLines = horizontalLatLngLines.map((line) => {
        const pts = latLngLineToPixel(line);
        return pts.map((p) => ({ x: p.x - topLeft.x, y: p.y - topLeft.y }));
      });

      // Draw grid lines
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;

      verticalPixelLines.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        ctx.lineTo(line[1].x, line[1].y);
        ctx.stroke();
      });

      horizontalPixelLines.forEach((line) => {
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        ctx.lineTo(line[1].x, line[1].y);
        ctx.stroke();
      });

      // --- Draw coordinates at grid intersections ---
      ctx.fillStyle = "black";
      ctx.font = "10px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      verticalLines.forEach((xMeter) => {
        horizontalLines.forEach((yMeter) => {
          const latLng = crs.unproject(L.point(xMeter, yMeter));
          const point = map.latLngToContainerPoint(latLng);
          const px = point.x - topLeft.x;
          const py = point.y - topLeft.y;
          const label = `${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)}`;
          ctx.fillText(label, px + 3, py + 3);
        });
      });

      // --- End coordinate labels ---

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
      <h2
        style={{
          position: "absolute",
          zIndex: 1000,
          margin: 10,
          background: "white",
          padding: "0.5em",
          borderRadius: "4px",
          boxShadow: "0 0 8px black",
          marginLeft: "40%",
        }}
      >
        Select an area
      </h2>
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
        {(queryData) ? parseTacticalJson() : null}
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

      {imageSize && (
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 10,
            zIndex: 1000,
            background: "rgba(255,255,255,0.8)",
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
