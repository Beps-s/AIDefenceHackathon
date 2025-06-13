import L from 'leaflet';
import { Marker, Polygon } from 'react-leaflet';

const PolygonWithText = props => {
  const center = L.polygon(props.coords).getBounds().getCenter();
  const text = L.divIcon({html: props.text});

  return(
    <Polygon color="blue" positions={props.coords}>
      <Marker position={center} icon={text} />
    </Polygon>
  );
}

export default PolygonWithText
