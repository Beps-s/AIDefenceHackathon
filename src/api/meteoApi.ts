import { LatLngTuple } from "leaflet";

type coordinateWithEl = {
    coordinate: LatLngTuple;
    elevation: number;
}

async function getElevetion(coordinates: LatLngTuble[]): Promise<coordinateWithEl[] | null> {
    const elevationData: coordinateWithEl[] = []
    coordinates.map(coordinate => {
        const url = `https://api.open-meteo.com/v1/elevation?latitude=${coordinate[0]}&longitude=${coordinate[1]}`
        fetch(url)
        .then(response => response.json())
        .then(data => {
            elevationData.push({coordinate, elevation: data.elevation[0]});
            console.log(elevationData);
        })
    })
    
    return elevationData;
}

export default {
    getElevetion
}