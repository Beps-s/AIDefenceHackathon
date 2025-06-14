import { LatLngTuple } from "leaflet";
async function getElevetion(coordinate: LatLngTuble): Promise<number | null> {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${coordinate[0]}&longitude=${coordinate[1]}`
    fetch(url)
    .then(response => response.json())
    .then(data => {
        return data.elevation[0];
    })
    
    return null;
}

export default {
    getElevetion
}