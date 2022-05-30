let fileDir = "positions.json";
let oriPositions = [];//这个list保存鼠标点击产生的关节点坐标
let targetPositions = [];//这个list保存录入的目标点坐标
let pInformations = [];//这个list保存附带输入信息的关节点
let positionList = [];//这个list保存相机位置和方向等信息
let maxHeight = 1000;
let count = 0;
let listLen = positionList.length; 
let editing = false;//是否处于编辑状态
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
var pickedPosition = {};

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
    //console.log(positionList);
    //console.log(positionList[1]);
    //positionList.push(nextp);
    return false;
}

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
                createPoint(position, inputPointsEntites, i, 0);
                //console.log(i);

            }
            inputPointsEntites.show = true;
            console.log(inputPointsEntites);
        }
    }
};

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
editBtn.onclick=editPathPosition();


function editPathPosition(){
    
    inputPointsEntites.show = true;
    editing = true;
    //////////////////////////
    handler.setInputAction(function(event){console.log(1);
        //console.log(onPanel);
        if(onPanel) return false;
        //console.log("clicked");
        ellipsoid = viewer.scene.globe.ellipsoid;
        //console.log(ellipsoid.radii);
        var position=viewer.camera.pickEllipsoid(
            event.position,ellipsoid
        );
        
        let pick = viewer.scene.pick(event.position,8,8);
        console.log(pick);
        propertiesPanel.style="display: none;";
        //console.log(position);
        if(Cesium.defined(pick)){
            //editing=false;
            //录入关节点参数
            //console.log(pick);
            //console.log(pick.primitive._id._name);
            pindex = parseInt(pick.primitive._id._name);
            pickedPosition = oriPositions[pindex];
            
            cType = 0;
            distance = 0;
            angle = 0;
            speed = 0.25;
            propertiesPanel.style="display: block;";
            targetPosition = {};
            //editing = false;
        }
        else{
            //设置关节点
            let ptype = 0;
            let cartographic = ellipsoid.cartesianToCartographic(position);
            let geographic = {
                longitude: Cesium.Math.toDegrees(cartographic.longitude),
                latitude: Cesium.Math.toDegrees(cartographic.latitude)
            }
            createPoint(position, inputPointsEntites,oriPositions.length,0);
            oriPositions.push(geographic);
            //console.log(geographic);
        }
        
    },Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

//完成编辑
var quitEditingBtn = document.getElementById('quitEditing');
quitEditingBtn.onclick=function(){
    //editing = false;
    inputPointsEntites.show=false;
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
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
    handler.setInputAction(function(event){
        //handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        console.log(1);
        //console.log(onPanel);
        if(onPanel) return false;
        //console.log("clicked");
        ellipsoid = viewer.scene.globe.ellipsoid;
        //console.log(ellipsoid.radii);
        var position=viewer.camera.pickEllipsoid(
            event.position,ellipsoid
        );
        let pos = viewer.camera.pickEllipsoid(
            event.position,ellipsoid
        );
        let cartographic = ellipsoid.cartesianToCartographic(pos);
        targetPosition = {
            longitude: Cesium.Math.toDegrees(cartographic.longitude),
            latitude: Cesium.Math.toDegrees(cartographic.latitude)
        }
        createPoint(position, inputPointsEntites,oriPositions.length, 1);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    },Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    
    return false;
}

$("#interpolation").click(function(){
    console.log(oriPositions);
    let ptlist = [];
    let plLen = oriPositions.length;
    for(let i = 0; i < plLen; i ++){
        let pt = [oriPositions[i].latitude,oriPositions[i].longitude];
        ptlist.push(pt);
    }
    spline = new Spline(ptlist, 4);
    /////////////
    console.log(oriPositions);
    console.log(spline);
})