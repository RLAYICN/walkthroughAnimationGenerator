var viewer = new Cesium.Viewer('cesiumContainer',{
    geocoder:false,
    inforBox:true,
    homeButton:false,
    sceneModePicker:true,
    baseLayerPicker:false,
    navigationHelpButton:false,
    animation:false,
    //creditContainer:"credit",
    timeline:false,
    fullscreenButton:true,
    vrButton:false,
    //orderIndependentTranslucency: false,

    imageryProvider: new Cesium.WebMapTileServiceImageryProvider({		 
        url: 'http://t0.tianditu.gov.cn/img_w/wmts?tk=341205112c99870bbf7ad6a068bdf091',
        layer:'img',
        style:'default',
        tileMatrixSetID:'w',
        format:'tiles',
        //maximumLevel: 20
    }) 
})
viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
    url: 'http://t0.tianditu.gov.cn/cia_w/wmts?tk=341205112c99870bbf7ad6a068bdf091',
    layer:'cia',
    style:'default',
    tileMatrixSetID:'w',
    format:'tiles',
    //maximumLevel: 20
}))

/*
 var imgprov = new Cesium.createTileMapServiceImageryProvider({
        url :'./data/china1_tms',
        fileExtension: 'png',
    });
    viewer.imageryLayers.addImageryProvider(imgprov);

*/

var handler = new Cesium.ScreenSpaceEventHandler();
var token = '341205112c99870bbf7ad6a068bdf091';
// 服务域名
var tdtUrl = 'https://t{s}.tianditu.gov.cn/';
// 服务负载子域
var subdomains=['0','1','2','3','4','5','6','7','8','9','10','11','12'];


//viewer.scene.globe.depthTestAgainstTerrain = true;
var modelEntites = viewer.entities.add(new Cesium.Entity());


/*
viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({undefined,
    url: "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
    layer: "tdtAnnoLayer",
    style: "default",
    format: "image/jpeg",
    tileMatrixSetID: "GoogleMapsCompatible"
}));



imageryProvider : new Cesium.UrlTemplateImageryProvider({undefined,
        url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
        layer: "tdtVecBasicLayer",
        style: "default",
        format: "image/png",
        tileMatrixSetID: "GoogleMapsCompatible",
        show: false
    })*/