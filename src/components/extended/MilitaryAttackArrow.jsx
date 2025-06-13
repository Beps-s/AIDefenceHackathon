import { Polyline, useMap } from "react-leaflet";
import { Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  centerLatLng,
  addLatLng,
  anglePointWithDistance,
  getDirection,
  distanceSegment,
} from "../../util.ts";

const MilitaryAttackArrow = ({
  positions,
  color = "red",
  weight = 10,
  arrowheadWidth = 1,
  text = "",
}) => {
  const map = useMap();

  const getArrowPathPoints = () => {
    let points = [];

    // generate right right side
    for (let i = 0; i < positions.length; i++) {
      const point = { lat: positions[i][0], lng: positions[i][1] };
      const previousPoint = positions[i - 1]
        ? { lat: positions[i - 1][0], lng: positions[i - 1][1] }
        : null;
      const nextPoint = positions[i + 1]
        ? { lat: positions[i + 1][0], lng: positions[i + 1][1] }
        : null;

      if (previousPoint && nextPoint) {
        const point_right = anglePointWithDistance(
          map,
          previousPoint,
          point,
          -90,
          weight * 200
        );
        const point_left = anglePointWithDistance(
          map,
          nextPoint,
          point,
          90,
          weight * 200
        );
        points.push(centerLatLng(point_right, point_left));
      } else if (previousPoint != null) {
        points.push(
          anglePointWithDistance(
            map,
            previousPoint,
            point,
            i != positions.length - 1 ? 90 : -90,
            weight * 100
          )
        );
      } else if (nextPoint != null)
        points.push(
          anglePointWithDistance(
            map,
            nextPoint,
            point,
            i != positions.length - 1 ? 90 : -90,
            weight * 100
          )
        );
    }

    // generate tip
    const tip = {
      lat: positions[positions.length - 1][0],
      lng: positions[positions.length - 1][1],
    };
    const beforeTip = {
      lat: positions[positions.length - 2][0],
      lng: positions[positions.length - 2][1],
    };

    const direction = getDirection(beforeTip, tip);

    points.push(
      anglePointWithDistance(
        map,
        beforeTip,
        tip,
        -90,
        weight * 200 * arrowheadWidth
      )
    );
    points.push(
      distanceSegment(map, tip, addLatLng(tip, direction), weight * 300)
    );
    points.push(
      anglePointWithDistance(
        map,
        beforeTip,
        tip,
        90,
        weight * 200 * arrowheadWidth
      )
    );

    // generate right side
    for (let i = positions.length - 1; i > -1; i--) {
      const point = { lat: positions[i][0], lng: positions[i][1] };
      const previousPoint = positions[i + 1]
        ? { lat: positions[i + 1][0], lng: positions[i + 1][1] }
        : null;
      const nextPoint = positions[i - 1]
        ? { lat: positions[i - 1][0], lng: positions[i - 1][1] }
        : null;

      if (previousPoint && nextPoint) {
        const point_right = anglePointWithDistance(
          map,
          previousPoint,
          point,
          -90,
          weight * 200
        );
        const point_left = anglePointWithDistance(
          map,
          nextPoint,
          point,
          90,
          weight * 200
        );
        points.push(centerLatLng(point_right, point_left));
      } else if (previousPoint != null) {
        points.push(
          anglePointWithDistance(
            map,
            previousPoint,
            point,
            i != positions.length - 1 ? -90 : 90,
            weight * 100
          )
        );
      } else if (nextPoint != null)
        points.push(
          anglePointWithDistance(
            map,
            nextPoint,
            point,
            i != positions.length - 1 ? -90 : 90,
            weight * 100
          )
        );
    }

    return points;
  };

  return (
    <>
      <Polyline
        color={color}
        stroke
        weight={8}
        positions={getArrowPathPoints()}
      >
        {text != "" ? (
          <Tooltip
            direction="center"
            position={positions[positions.length - 2]}
            opacity={0.9}
          >
            <span>{text}</span>
          </Tooltip>
        ) : null}
      </Polyline>
    </>
  );
}

export default MilitaryAttackArrow;