import L from 'leaflet';
import { Marker, Circle } from 'react-leaflet';

const CircleWithText = props => {
  const text = L.divIcon({html: props.text, iconSize: 0});

  return(
    <Circle center={props.center} radius={props.radius}>
      <Marker position={props.center} icon={text} />
    </Circle>
  );
}

export default CircleWithText
