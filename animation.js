var viewer = new Cesium.Viewer('cesiumContainer',{

})

//document.body.className = 'cesium-lighter';
document.body.className = '';
viewer.animation.applyThemeChanges();

let count = 0;
let p1 = {
    longitude: 114.38,
    latitude: 36.90,
    height: 351.68,
    heading: 0.0,
    pitch: -28.0,
    roll: 0.0,
    duration: 10,
}
let p2 = {
    longitude: 160.38,
    latitude: 36.90,
    height: 351.68,
    heading: 0.0,
    pitch: -28.0,
    roll: 0.0,
    duration: 10,
}
let p3 = {
    longitude: -114.38,
    latitude: 36.90,
    height: 351.68,
    heading: 0.0,
    pitch: -28.0,
    roll: 0.0,
    duration: 10,
}
// p2 p3
let positionList =[p1,p2,p3];
function fly() {
    if (count >= positionList.length) {
        return;
    }
    var position = positionList[count];

    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
            position.longitude,
            position.latitude,
            position.height
        ),
        duration: parseFloat(position.duration),
        orientation: {
            heading: Cesium.Math.toRadians(position.heading),
            pitch: Cesium.Math.toRadians(position.pitch),
            roll: Cesium.Math.toRadians(position.roll)
        },
        complete: function() {
            fly();
        }
    });
    count++;
}

fly();