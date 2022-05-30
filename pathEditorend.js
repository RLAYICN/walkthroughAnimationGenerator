var pathController = new PathController();
var oriPositions = [];//保存输入的位置坐标
var inputPointsEntites = viewer.entities.add(new Cesium.Entity());//编辑状态点组合
var listLen = 0;
var curCameraNodeIndex = 0;
var ellipsoid;
var fileDir = "";
var editingNode = false;
var targetPosition;
var targetNode;
var count = 0;
var viewCamera = {
    distance: ko.observable(0),
    angle: ko.observable(0),
    speed: ko.observable(25),

}

var pointProperties = document.getElementById("pointProperties");
ko.applyBindings(viewCamera, pointProperties);

var disipt = document.getElementById("distance");
var angipt = document.getElementById("angle");
var speipt = document.getElementById("speed");

$("#angle").attr('disabled',true);

$("#CType").change(function(){
    let ctype = Number($("#CType").val());
    console.log(ctype);
    switch(ctype){
        case 0:{
            $("#distance").removeAttr("disabled");
            $("#angle").attr('disabled',true);
            //$("#speed").attr('disabled',false);
            break;
        }
        case 1:{
            $("#distance").removeAttr("disabled");
            $("#angle").attr('disabled',true);
            //$("#speed").attr('disabled',false);
            break;
        }
        case 2:{
            $("#distance").attr('disabled',true);
            $("#angle").removeAttr("disabled");
            //$("#speed").attr('disabled',false);
            break;
        }
        case 3:{
            $("#distance").removeAttr("disabled");
            $("#angle").attr('disabled',true);
            //$("#speed").attr('disabled',false);
            break;
        }
        case 4:{
            $("#distance").removeAttr("disabled");
            $("#angle").attr('disabled',true);
            //$("#speed").attr('disabled',false);
            break;
        }
        default: break;
    }


    return false;
})
var propertiesPanel = document.getElementById("pointProperties");

//设置和编辑关节点
function setPathPosition(){
    console.log("editing");
    inputPointsEntites.show = true;
    //editing = true;
    handler.setInputAction(function(event){
        if(onPanel) return false;
        if(editingNode){
            if(confirm("未提交的信息不会保存，是否放弃？")){
                editingNode = false;
            }else{
                //not handled
                return;
            }
        }
        //console.log(1);
        //console.log(onPanel);
        
        //console.log("clicked");
        ellipsoid = viewer.scene.globe.ellipsoid;
        //console.log(ellipsoid.radii);
        let position=viewer.camera.pickEllipsoid(
            event.position,ellipsoid
        );
        let pick = viewer.scene.pick(event.position,8,8);
        //console.log(pick);
        propertiesPanel.style="display: none;";
        //console.log(position);
        if(Cesium.defined(pick)){
            editingNode = true;
            //editing=false;
            //录入关节点参数
            //console.log(pick);
            //console.log(pick.primitive._id._name);
            curCameraNodeIndex = parseInt(pick.primitive._id._name);
            pickedPosition = oriPositions[curCameraNodeIndex];
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
            console.log(geographic);
            createPoint(position, inputPointsEntites,oriPositions.length,0);
            oriPositions.push(geographic);
            //console.log(geographic);
        }
        
    },Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

var editBtn = document.getElementById('edit');
editBtn.onclick=function(){
    console.log("edit");
    setPathPosition();
}
var quit = document.getElementById("quitEditing");
quit.onclick = function(){
    editingNode = false;
    inputPointsEntites.show = false;
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

//选择目标点
$("#chooseTarget").click(function(){
    handler.setInputAction(function(event){
        
        //handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        //console.log(1);
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
})

//提交信息
$("#submit").click(function(){
    let pos = oriPositions[curCameraNodeIndex];
    let cType = Number($("#CType").val());    
    console.log(pathController);
    pathController.setCameraParameter(pos, cType, targetPosition);
    editingNode = false;
    return false;
})

function preparation() {
    //动画就位
    ////////////
    listLen = pathController.cameraNodeList.length; 
    curCameraNode = pathController.cameraNodeList[0];
    viewer.camera.setView({
        destination : Cesium.Cartesian3.fromDegrees(curCameraNode.longitude, curCameraNode.latitude, curCameraNode.height), // 设置位置
        orientation: {
            heading : Cesium.Math.toRadians(curCameraNode.heading), // 方向
            pitch : Cesium.Math.toRadians(curCameraNode.pitch),// 倾斜角度
            roll : Cesium.Math.toRadians(curCameraNode.roll)
        }
    })
}

function fly() {
    
    if (count >= listLen) {
        return;
    }
    console.log("fly"+count);
    var position = pathController.cameraNodeList[count];
    count++;
    //count %= listLen;
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

$("#preview").click(function(){
    inputPointsEntites.show = !inputPointsEntites.show;
})


var prepareBtn = document.getElementById("prepare");
prepareBtn.onclick = function(){
    preparation();
}


$("#play").click(function(){
    if(isRecordingBox.checked){
        recorder.start();
    }
    count = 0;
    fly();
});

$("#quit").click(function(){

    count = listLen;
    recorder.stop();
})

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



window.onload=function(){
    var fileName = document.getElementById("fileName").innerHTML="已选择:"+fileDir;
    
}

//文件选择
var getFile =document.getElementById("files");
getFile.onchange=function(e){
    //获取到文件以后就会返回一个对象，通过这个对象即可获取文件
    //console.log(e.currentTarget.files);//所有文件，返回的是一个数组
    //console.log(e.currentTarget.files[0].name);//文件名
    fileDir = "/data/"+ e.currentTarget.files[0].name;
    fileName.innerHTML="已选择:"+e.currentTarget.files[0].name;;
    
    let request = new XMLHttpRequest();
    request.open("get", fileDir);
    request.send(null);
    request.onload = function(){
        if(request.status == 200){
            let json = JSON.parse(request.responseText);
            let plist = json.positions;
            oriPositions =  oriPositions.concat(plist);
            console.log(oriPositions);
            ellipsoid = viewer.scene.globe.ellipsoid;
            for(let i = 0; i < oriPositions.length; i ++){
                let oriP = oriPositions[i];
                let position = Cesium.Cartesian3.fromDegrees (oriP.longitude, oriP.latitude, 0 , ellipsoid);
                createPoint(position, inputPointsEntites, i,0);
                //console.log(i);
            }
            inputPointsEntites.show = true;
            console.log(inputPointsEntites);
        }
    }
};

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


//视频导出
function download (videoUrl) {
    var a = document.createElement('a')
    a.href = videoUrl
    a.download = 'record-canvas.webm'
    // a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
}

var isRecordingBox = document.getElementById('isRecording');
