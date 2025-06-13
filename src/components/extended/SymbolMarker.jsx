import ms from "milsymbol";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";

const symbol = new ms.Symbol("13031200000000000000", {
  size: 24,
}).asSVG();

const icon = L.divIcon({
  html: `
    <svg>${symbol}</svg>
    `,
});

const SymbolMarker = ({ position, text }) => {
  return (
    <Marker icon={icon} position={position} >
      <Tooltip offset={[0, 0]}>{text}</Tooltip>
    </Marker>
  );
};

export default SymbolMarker;