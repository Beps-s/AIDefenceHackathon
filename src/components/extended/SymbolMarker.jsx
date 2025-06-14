import ms from "milsymbol";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";



const SymbolMarker = ({ position, text, code }) => {
  const symbol = new ms.Symbol((code) ? code : "130325000013010000000000000000", {
    size: 24,
  }).asSVG();

  const icon = L.divIcon({
    iconAnchor: [12, 20],
    iconSize: 0,
    iconUrl: "",
    html: `
      <svg>${symbol}</svg>
      `,
  });

  return (
    <Marker icon={icon} position={position} >
      {(text) ? <Tooltip offset={[0, 0]}>{text}</Tooltip> : null}
    </Marker>
  );
};

export default SymbolMarker;