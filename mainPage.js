var viewer = new Cesium.Viewer('cesiumContainer',{
    geocoder:true,
    inforBox:true,
    homeButton:false,
    sceneModePicker:false,
    baseLayerPicker:false,
    navigationHelpButton:false,
    animation:false,
    creditContainer:"credit",
    timeline:false,
    fullscreenButton:false,
    vrButton:false,
    
    imageryProvider : new Cesium.UrlTemplateImageryProvider({undefined,
        url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
                layer: "tdtVecBasicLayer",
                style: "default",
                format: "image/png",
                tileMatrixSetID: "GoogleMapsCompatible",
                show: false
    })
})

var handler = new Cesium.ScreenSpaceEventHandler();

var successCallback = function(position) {
    // 由于使用了 'maximumAge' 选项， position 对象
    // 保证最多已经获取 10 分钟
    var lat = position.coords.latitude; //纬度
    var lag = position.coords.longitude; //经度
    //console.log('纬度:' + lat + ',经度:' + lag);
    
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lag, lat, 15000.0)
    })
}

var errorCallback = function(error) {
    // 做一些错误处理
    // viewer.camera.flyTo({
    //     destination : Cesium.Cartesian3.fromDegrees(114.40, 31.48, 15000.0)
    // })
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("定位失败,用户拒绝请求地理定位");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("定位失败,位置信息是不可用");
            break;
        case error.TIMEOUT:
            alert("定位失败,请求获取用户位置超时");
            break;
        case error.UNKNOWN_ERROR:
            alert("定位失败,定位系统失效");
            break;
    }
}

var options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({undefined,
    url: "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
        layer: "tdtAnnoLayer",
        style: "default",
        format: "image/jpeg",
        tileMatrixSetID: "GoogleMapsCompatible"
}));

let fileDir = "positions.json";
let oriPositions = [];//这个list保存鼠标点击产生的关节点坐标
let targetPositions = [];//这个list保存录入的目标点坐标
let pInformations = [];//这个list保存附带输入信息的关节点
let positionList = [];//这个list保存相机位置和方向等信息
let maxHeight = 1000;
let count = 0;
let listLen = positionList.length; 
let editing = false;//是否处于编辑状态
let onPanel = false;//鼠标是否位于编辑版上
let inputPointsEntites = viewer.entities.add(new Cesium.Entity());//编辑状态点组合
let cType = 0;
let distance = 0;
let angle = 0;
let speed = 0.25;
let choosingTarget = false;
let choosingModelPosition = false;
let editingIndex = 0;
let pindex = -1;
let modelPosition = {};
let targetPosition = {};
let url = 'data/box.gltf';

//计算旋转矩阵
function GetTargeMM(pointA, pointB) {
    //console.log(pointA);
    //console.log(pointB);
    //获取AB向量
    const vecAB = Cesium.Cartesian3.subtract(pointB, pointA, new Cesium.Cartesian3());
    //归一化
    const normalAB = Cesium.Cartesian3.normalize(vecAB, new Cesium.Cartesian3());
    //计算旋转矩阵
    const rotationMatrix3 = Cesium.Transforms.rotationMatrixFromPositionVelocity(pointA, normalAB);
    const modelMatrix4 = Cesium.Matrix4.fromRotationTranslation(rotationMatrix3, pointA);
    return modelMatrix4;
}

//计算rph
function getRPH(rotateMatrix){
    //console.log(rotateMatrix);
    var sy = Math.sqrt(rotateMatrix[0] * rotateMatrix[0] + rotateMatrix[4] * rotateMatrix[4] );
    var singular = sy < 1e-6;
    var x,y,z;
    if(!singular){
        x = Math.atan2(rotateMatrix[9],rotateMatrix[10]);
        y = Math.atan2(-rotateMatrix[8],sy);
        z = Math.atan2(rotateMatrix[4],rotateMatrix[0]);
    }else{
        x = Math.atan2(-rotateMatrix[6],rotateMatrix[5]);
        y = Math.atan2(-rotateMatrix[8],sy);
        z = 0;
    }
    //console.log(x);
    //console.log(y);
    //console.log(z);
    return {
        roll: x*(180.0/Math.PI),
        pitch: y*(180.0/Math.PI),
        heading: z*(180.0/Math.PI)
    }
}

//设置相机参数
function setCameraParameter(_position, cType, target){
    //console.log(_position);
    //console.log(target);
    var oriPosition = _position;
    var pos = Cesium.Cartesian3.fromDegrees(_position.longitude,_position.latitude,_position.height); 
    var tgt = Cesium.Cartesian3.fromDegrees(target.longitude,target.latitude,target.height);
    var rotateMatrix = GetTargeMM(pos,tgt);
    var rph = getRPH(rotateMatrix);
    //console.log(rph);
    var p = {
        longitude: oriPosition.longitude,
        latitude: oriPosition.latitude,
        height: maxHeight,
        heading: rph.heading-90,
        pitch: -rph.pitch,
        roll: 0,
        duration: 4,
        target: tgt,
    };
    var nextp = JSON.parse(JSON.stringify(p));//深拷贝
    switch(cType){
        case 0:{
            //推
            //console.log(pos);
            //console.log(p);
            
            //console.log("orip");
            //console.log(positionList);
            //console.log(positionList[0]);

            var vec = Cesium.Cartesian3.subtract(tgt,pos, new Cesium.Cartesian3());
            //console.log("vec0");
            //console.log(vec);
            //var vec = Cesium.Cartesian3.normalize(dirvec, new Cesium.Cartesian3());
            
            vec = Cesium.Cartesian3.multiplyByScalar(vec,speed,new Cesium.Cartesian3());
            //console.log("vec1");
            //console.log(vec);
            pos = Cesium.Cartesian3.add(pos,vec,new Cesium.Cartesian3());
            //console.log("pos");
            //console.log(pos);
            
            ellipsoid = viewer.scene.globe.ellipsoid;
            var cartographic = ellipsoid.cartesianToCartographic(pos);
            nextp.longitude = Cesium.Math.toDegrees(cartographic.longitude);
            nextp.latitude = Cesium.Math.toDegrees(cartographic.latitude);
            //console.log(nextp);
            break;
        }
            
        case 1:
            //拉
            //positionList.push(p);
            var vec = Cesium.Cartesian3.subtract(pos,tgt, new Cesium.Cartesian3());
            vec = Cesium.Cartesian3.multiplyByScalar(vec,speed,new Cesium.Cartesian3());
            pos = Cesium.Cartesian3.add(pos,vec,new Cesium.Cartesian3());
            ellipsoid = viewer.scene.globe.ellipsoid;
            var cartographic = ellipsoid.cartesianToCartographic(pos);
            nextp.longitude = Cesium.Math.toDegrees(cartographic.longitude);
            nextp.latitude = Cesium.Math.toDegrees(cartographic.latitude);
           
            break;
        case 2:
            //摇
            nextp.heading = nextp.heading+parseInt(angle);
            //console.log(angle);
            break;
        case 3:
            //移
            var vec = Cesium.Cartesian3.subtract(pos,tgt, new Cesium.Cartesian3());
            vec = Cesium.Cartesian3.cross(vec,new Cesium.Cartesian3(speed,speed,speed),new Cesium.Cartesian3());
            pos = Cesium.Cartesian3.add(pos,vec,new Cesium.Cartesian3());
            ellipsoid = viewer.scene.globe.ellipsoid;
            var cartographic = ellipsoid.cartesianToCartographic(pos);
            nextp.longitude = Cesium.Math.toDegrees(cartographic.longitude);
            nextp.latitude = Cesium.Math.toDegrees(cartographic.latitude);
            break;
        
        case 4:
            //升降
            nextp.height += parseInt(distance);
            //console.log(nextp.height);
            break;
        default:
            console.log("default");
            break;
    };
    positionList.push(p);
    positionList.push(nextp);
    console.log(positionList);
    //console.log(positionList[1]);
    //positionList.push(nextp);
    return false;
}

window.onload=function(){
    var fileName = document.getElementById("fileName").innerHTML="已选择:"+fileDir;
    
}
window.navigator.geolocation.getCurrentPosition(successCallback,errorCallback,options);
//文件选择
var getFile =document.getElementById("files");
getFile.onchange=function(e){
    //获取到文件以后就会返回一个对象，通过这个对象即可获取文件
    //console.log(e.currentTarget.files);//所有文件，返回的是一个数组
    //console.log(e.currentTarget.files[0].name);//文件名
    fileDir = e.currentTarget.files[0].name;
    fileName.innerHTML="已选择:"+fileDir;
    
    var request = new XMLHttpRequest();
    request.open("get", fileDir);
    request.send(null);
    request.onload = function(){
        if(request.status == 200){
            var json = JSON.parse(request.responseText);
            var plist = json.positions;
            oriPositions =  oriPositions.concat(plist);
            console.log(oriPositions);
            ellipsoid = viewer.scene.globe.ellipsoid;
            for(var i = 0; i < oriPositions.length; i ++){
                var oriP = oriPositions[i];
                var position = Cesium.Cartesian3.fromDegrees (oriP.longitude, oriP.latitude, 0 , ellipsoid);
                createPoint(position, inputPointsEntites, 0,i);
                //console.log(i);
            }
            inputPointsEntites.show = true;
            console.log(inputPointsEntites);
        }
    }
};

var interpolationBtn = document.getElementById('interpolation');
interpolationBtn.onclick=function(){

}

//绘制关键点
function createPoint(pos, _parent, type, pindex){
    //type{
    //    "cameraTrack":0,
    //    "targetPoint":1
    //}
    //console.log(viewer.entities);
    //console.log(entities);
    if(0 == type){
        //关节点
        console.log(pos);
        viewer.entities.add({
            //pindex为该point实体对应的position对象在oriPositions数组中的下标
            name: pindex.toString(),
            position: pos,
            parent: _parent,
            point:{
                
                color: Cesium.Color.DARKRED,
                pixelSize: 10,
                
                scaleByDistance:{
                    near: 0.0,
                    nearValue: 8,
                    far: 50000,
                    farValue: 1,
                },
            }
        })
    }else if(1 == type){
        //目标点
        viewer.entities.add({
            position: pos,
            parent: _parent,
            point:{
                color: Cesium.Color.BLUE,
                pixelSize: 10,
                scaleByDistance:{
                    near: 0.0,
                    nearValue: 8,
                    far: 50000,
                    farValue: 1,
                },
            }
        })
    }
}

//在控制面板上失禁用选点
var iptPanel = document.getElementById('inputPanel');
var propertiesPanel = document.getElementById('pointProperties');

iptPanel.onmouseover=function(){
    onPanel = true;
}
iptPanel.onmouseout=function(){
    onPanel = false;
}
propertiesPanel.onmouseover=function(){
    onPanel = true;
}
propertiesPanel.onmouseout=function(){
    onPanel = false;
}

document.getElementById('addModel').onclick = function() {
    //let tileInfo = prompt("请输入http://ip:port/*/tileset.json");
    
    alert("请选择模型位置");
    choosingModelPosition = true;
    
}


//点击事件响应
handler.setInputAction(function(event){
    //console.log(onPanel);
    if(onPanel) return false;
    //console.log("clicked");
    ellipsoid = viewer.scene.globe.ellipsoid;
    //console.log(ellipsoid.radii);
    var position=viewer.camera.pickEllipsoid(
        event.position,ellipsoid
    );
    if(choosingModelPosition){
        var cartographic = ellipsoid.cartesianToCartographic(position);
        modelPosition={
            longitude: Cesium.Math.toDegrees(cartographic.longitude),
            latitude: Cesium.Math.toDegrees(cartographic.latitude)
        }
        var scene = viewer.scene;
        var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
            Cesium.Cartesian3.fromDegrees(modelPosition.longitude,modelPosition.latitude,0)
        );
        var model = scene.primitives.add(Cesium.Model.fromGltf({
            url: url,
            modelMatrix: modelMatrix,
            minimumPixelSize: 128,
            maximumScale: 4000,
        }));
        choosingModelPosition = false;
        //return false;
    }
    else if(choosingTarget){
        //设置目标点
        var ptype = 1;
        var cartographic = ellipsoid.cartesianToCartographic(position);
        targetPosition = {
            longitude: Cesium.Math.toDegrees(cartographic.longitude),
            latitude: Cesium.Math.toDegrees(cartographic.latitude)
        }
        createPoint(position, inputPointsEntites, ptype, oriPositions.length);
        choosingTarget = false;
    }
    else if(editing){
        var pick = viewer.scene.pick(event.position);
        propertiesPanel.style="display: none;";
        //console.log(position);
        if(Cesium.defined(pick)){
            editing=false;
            //录入关节点参数
            //console.log(pick);
            //console.log(pick.primitive._id._name);
            pindex = parseInt(pick.primitive._id._name);
            var position = oriPositions[pindex];
            
            cType = 0;
            distance = 0;
            angle = 0;
            speed = 0.25;
            propertiesPanel.style="display: block;";
            //editing = false;
        }
        else{
            //设置关节点
            var ptype = 0;
            var cartographic = ellipsoid.cartesianToCartographic(position);
            var geographic = {
                longitude: Cesium.Math.toDegrees(cartographic.longitude),
                latitude: Cesium.Math.toDegrees(cartographic.latitude)
            }
            createPoint(position, inputPointsEntites, ptype,oriPositions.length);
            oriPositions.push(geographic);
            //console.log(geographic);
        }
    }
    
},Cesium.ScreenSpaceEventType.LEFT_CLICK);

//视频导出
function download (videoUrl) {
    var a = document.createElement('a')
    a.href = videoUrl
    a.download = 'record-canvas.webm'
    // a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
}

const stream = viewer.canvas.captureStream();
const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
const data = [];
recorder.ondataavailable = function (event) {
    if (event.data && event.data.size) {
        data.push(event.data);
    }
};
recorder.onstop = () => {
const url = URL.createObjectURL(new Blob(data, { type: 'video/webm' }));
    download(url);
    document.querySelector("#videoContainer").style.display = "block";
    document.querySelector("video").src = url;
};
/*
recorder.start();
setTimeout(() => {
    recorder.stop();
}, 6000);
*/
/*
viewer.camera.setView({
    destination : Cesium.Cartesian3.fromDegrees(117.280000,31.860000, 2000.0), // 设置位置
    orientation: {
      //heading : Cesium.Math.toRadians(0.0), // 方向
      //pitch : Cesium.Math.toRadians(-90.0),// 倾斜角度
      //roll : 0
    }
});
*/
function preparation() {
    
    listLen = positionList.length; 
    var position = positionList[0];
    viewer.camera.setView({
        destination : Cesium.Cartesian3.fromDegrees(position.longitude, position.latitude, position.height), // 设置位置
        orientation: {
        heading : Cesium.Math.toRadians(position.heading), // 方向
        pitch : Cesium.Math.toRadians(position.pitch),// 倾斜角度
        roll : 0
    }
    })
}

function fly() {
    
    if (count >= listLen) {
        return;
    }
    console.log("fly"+count);
    var position = positionList[count];
    count++;
    count %= listLen;
    //viewer.camera.trackedEntity = redBox;
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
            position.longitude,
            position.latitude,
            position.height
        ),
        duration: parseFloat(position.duration),
        maximumHeight: 322,
        orientation: {
            heading: Cesium.Math.toRadians(position.heading),
            pitch: Cesium.Math.toRadians(position.pitch),
            roll: Cesium.Math.toRadians(position.roll)
        },
        complete: function() {
            
            fly();
        }
    });
    
    
    
}




  
//编辑
var editBtn = document.getElementById('edit');
editBtn.onclick=function(position){
    window.navigator.geolocation.getCurrentPosition(successCallback,errorCallback,options);
    
    /*
    viewer.camera.setView({
        destination : Cesium.Cartesian3.fromDegrees(117.280000,31.860000, 2000.0), // 设置位置
        orientation: {
        heading : Cesium.Math.toRadians(0), // 方向
        pitch : Cesium.Math.toRadians(-90),// 倾斜角度
        roll : 0
        }
    })*/
    inputPointsEntites.show = true;
    editing = true;
}

//完成编辑
var quitEditingBtn = document.getElementById('quitEditing');
quitEditingBtn.onclick=function(){
    editing = false;
    inputPointsEntites.show=false;
    console.log(inputPointsEntites);
}

//预览
var previewBtn = document.getElementById('preview');
previewBtn.onclick=function(){
    inputPointsEntites.show = !inputPointsEntites.show;
}

//就位
var prepBtn = document.getElementById('prepare');
prepBtn.onclick=function(){
    //if(oriPositions.length > 0){
        //------------
        
    //}
    preparation();
    //console.log(viewer.camera);
}

//播放
var isRecordingBox = document.getElementById('isRecording');
var playBtn = document.getElementById('play');
playBtn.onclick=function(){
    if(isRecordingBox.checked){
        recorder.start();
    }
    count = 1;
    fly();
}

//停止
var quitBtn = document.getElementById('quit');
quitBtn.onclick=function(){
    console.log(listLen);
    count = listLen;
    recorder.stop();
}

var submitBtn = document.getElementById('submit');
submitBtn.onclick=function(){

    cType = parseInt(document.getElementById('cameraType').value);
    distance = document.getElementById('distance').value;
    angle = document.getElementById('angle').value;
    speed = document.getElementById('speed').value/100;
    choosingTarget = false;
    //console.log(cType);
    //console.log(distance);
    //console.log(angle);
    //console.log(speed);
    //console.log(targetPosition);
    var pos = oriPositions[pindex];
    setCameraParameter(pos, cType, targetPosition);
    editing = true;
    return false;
}

var chooseTargetBtn = document.getElementById("chooseTarget");
chooseTargetBtn.onclick=function(){
    choosingTarget = true;
    return false;
}


//纹理图绘制
function getColorRamp(elevationRamp) {
    var ramp = document.createElement('canvas');
    ramp.width = 1;
    ramp.height = 100;
    var ctx = ramp.getContext('2d');

    var values = elevationRamp;
    var grd = ctx.createLinearGradient(0, 0, 0, 100);
    grd.addColorStop(values[0], '#000000'); //black
    grd.addColorStop(values[1], '#2747E0'); //blue
    grd.addColorStop(values[2], '#D33B7D'); //pink
    grd.addColorStop(values[3], '#D33038'); //red
    grd.addColorStop(values[4], '#FF9742'); //orange
    grd.addColorStop(values[5], '#ffd700'); //yellow
    grd.addColorStop(values[6], '#ffffff'); //white

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1, 100);
    return ramp;
}
/*
var redBox = viewer.entities.add({
    name : 'red box',
    position: Cesium.Cartesian3.fromDegrees(117.28,31.86,250.0),
    box : {
        dimensions : new Cesium.Cartesian3(400,300,500),
        material: getColorRamp([0.0, 0.045, 0.1, 0.15, 0.37, 0.54, 1.0], true),
        //material : Cesium.Color.RED.withAlpha(0.5),
        outline: true,
        outlineColor:Cesium.Color.BLACK,
    }
})
;
*/
var x = 360.0;
var y = -920.0;
var z = -820.0;
// var x = 0;
// var y = 0;
// var z = 0;
var m = Cesium.Matrix4.fromArray([
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    x, y, z, 1.0
]);

var tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
    url: "../data/Scene/testm3DTiles.json", //数据路径
    maximumScreenSpaceError: 2, //最大的屏幕空间误差
    maximumNumberOfLoadedTiles: 1000, //最大加载瓦片个数
    modelMatrix: m //形状矩阵
}));
