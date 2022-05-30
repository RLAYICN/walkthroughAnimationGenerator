
var onPanel = false;
var pickedProject;
var mtype = 0;

var modelController = [];

var modelURL;
var docPanel = document.getElementById('documentModel');

var modelEditMode = false;
var gotModel = false;
var viewModel = {
    Scale: ko.observable(0),
    RotateX: ko.observable(0),
    RotateY: ko.observable(0),
    RotateZ: ko.observable(0),
    color: ko.observable('#FFFFFF')
};
var leftDownFlag = false;

//knockout.track(viewModel);
var modelProperties = document.getElementById('gliders');
ko.applyBindings(viewModel, modelProperties);



//模型类型选择和界面控件变换
var modelInputType = document.getElementsByName('mtype');
modelInputType[0].onclick=function(){
    docPanel.style="display:block";
    priPanel.style="display:none";
    mtype = 0;
}

modelInputType[1].onclick=function(){
    priPanel.style="display:block";
    docPanel.style="display:none";
    mtype = 1;
}

//获取鼠标点击位置
function getPositionFromMouseClick(mouseClickPosition){
    handler.setInputAction(function(event){
        let ellipsoid = viewer.scene.globe.ellipsoid;
        let position=viewer.camera.pickEllipsoid(event.position,ellipsoid);
        let cartographic = ellipsoid.cartesianToCartographic(position);
        mouseClickPosition={
            longitude: Cesium.Math.toDegrees(cartographic.longitude),
            latitude: Cesium.Math.toDegrees(cartographic.latitude)
        }
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);//移除对左单击事件的处理
        ////////////////not test
        viewer.zoomTo(
            pickedProject,
            new Cesium.HeadingPitchRange(
              0.0,
              -0.5,
              pickedProject.boundingSphere.radius * 2.0
            )
        );

    },Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function modelPositionSetting(event){
    let ellipsoid = viewer.scene.globe.ellipsoid;
    let position=viewer.camera.pickEllipsoid(event.position,ellipsoid);
    let cartographic = ellipsoid.cartesianToCartographic(position);
    let modelTargetPosition={
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude)
    }
    //console.log(modelTargetPosition);
    let scene = viewer.scene;
    let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
        Cesium.Cartesian3.fromDegrees(modelTargetPosition.longitude,modelTargetPosition.latitude,0)
    );
    var gltfmodelCOntroller = new GltfModelController(
        modelController.length,modelURL,modelMatrix,128,4000
    )
    //console.log(model);
    scene.primitives.add(gltfmodelCOntroller.model);
    //var temmodel = JSON.parse(JSON.stringify(model));
    modelController.push(gltfmodelCOntroller);
    //console.log(model);
    //console.log(modelController);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);//移除对左单击事件的处理
}

var addModelBTN = document.getElementById('addModel');
var modelPanel = document.getElementById('modelProperties');


//从文件添加模型
var addDocModelBTN=document.getElementById('addDocModel');
addDocModelBTN.onchange = function(e) {
    //锁定相机视角
    viewer.camera.setView({
        orientation: {
            pitch: Cesium.Math.toRadians(-90),
            roll: 0.0
        }
    });
    viewer.scene.screenSpaceCameraController.enableTilt = false;
    //let tileInfo = prompt("请输入http://ip:port/*/tileset.json");
    let modelURL = "/data/"+e.currentTarget.files[0].name;
    //let modelURL = "/data/box.gltf";
    //模型文件要求为*.glb，*.gltf格式，且位于‘/data’目录下
    //console.log(modelURL);
    
    //alert("请选择模型位置");
    handler.setInputAction(function(event){
        let ellipsoid = viewer.scene.globe.ellipsoid;
        let position=viewer.camera.pickEllipsoid(event.position,ellipsoid);
        let cartographic = ellipsoid.cartesianToCartographic(position);
        let modelTargetPosition={
            longitude: Cesium.Math.toDegrees(cartographic.longitude),
            latitude: Cesium.Math.toDegrees(cartographic.latitude),
        }
        let color = hex2cesiumColor($("#color").val());
        //console.log(modelTargetPosition);
        let scene = viewer.scene;
        let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
            Cesium.Cartesian3.fromDegrees(modelTargetPosition.longitude,modelTargetPosition.latitude,0,ellipsoid)
        );
        /*
        let gltfmodelCOntroller = new GltfModelController({
            id: modelController.length.toString(),
            url: modelURL,
            modelMatrix: modelMatrix,
            minimumPixelSize: 128,
            maximumScale: 4000,
            color: color,
        })*/
        let gltfmodelCOntroller = new GltfModelController(
            modelController.length.toString(),modelURL,modelMatrix,128,
            4000,color
        )
        //console.log(model);
        scene.primitives.add(gltfmodelCOntroller.model);
        //var temmodel = JSON.parse(JSON.stringify(model));
        modelController.push(gltfmodelCOntroller);
        console.log(gltfmodelCOntroller.model);
        //console.log(modelController);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);//移除对左单击事件的处理
    },Cesium.ScreenSpaceEventType.LEFT_CLICK);

    //取消视角锁定
    viewer.scene.screenSpaceCameraController.enableTilt = true;
    
}

//在控制面板上失禁用点击选点事件

modelPanel.onmouseover=function(){
    onPanel = true;
}

modelPanel.onmouseout=function(){
    onPanel = false;
}

function modelProperteSettingInitiate(event){
    if(onPanel) return false;//忽略面板上的点击事件
    //console.log(viewer.scene.pick(event.position,8,8));
    console.log(viewer.scene.primitives);
    pickedProject = this.viewer.scene.pick(event.position);
    console.log(pickedProject);
    if(Cesium.defined(pickedProject)){
        gotModel = true;
        viewModel = {
            Scale: 1,
            RotateX:0,
            RotateY:0,
            RotateZ:0
        };
    }
}

function leftDownAction(event){
    console.log("leftdown");
    
    pickedProject = this.viewer.scene.pick(event.position);
    leftDownFlag = true;
    //pickedProject=modelController[0].model;
    if(pickedProject){
        this.viewer.scene.screenSpaceCameraController.enableRotate = false;
    }
    
}

function leftUpAction(event){
    console.log("leftup");
    leftDownFlag = false;
    pickedProject=null;
    this.viewer.scene.screenSpaceCameraController.enableRotate = true;//解锁相机
}

function mouseMoveAction(event) {
    if (leftDownFlag === true && pickedProject != null) {
        console.log("mousemove");
        //let dest = this.viewer.camera.getPickRay(event.endPosition);
        //let cartesian = this.viewer.scene.globe.pick(dest, this.viewer.scene);
        let ellipsoid = viewer.scene.globe.ellipsoid;
        let position=viewer.camera.pickEllipsoid(event.endPosition,ellipsoid);
        let cartographic = ellipsoid.cartesianToCartographic(position);
        let modelTargetPosition={
            longitude: Cesium.Math.toDegrees(cartographic.longitude),
            latitude: Cesium.Math.toDegrees(cartographic.latitude),
        }
        //console.log(modelTargetPosition);
        //let scene = viewer.scene;
        if(0 == mtype){
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
                Cesium.Cartesian3.fromDegrees(modelTargetPosition.longitude,modelTargetPosition.latitude,0,ellipsoid)
            );
            pickedProject.modelMatrix = modelMatrix;
        }else if(1 == mtype){
            let modelPosition = Cesium.Cartesian3.fromDegrees (modelTargetPosition.longitude,modelTargetPosition.latitude, 0 , ellipsoid);
            pickedProject.position = modelPosition;
        }
        
    }
}

addModelBTN.onclick = function(){
    console.log("editing..");
    modelPanel.style="display: block";
}


//模型更改和参数编辑
/*
addModelBTN.onclick=function(){
    console.log("editing..");
    modelPanel.style="display: block";
    modelEditMode = true;
    //移除其他模式下的鼠标事件
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    gotModel = false;
    handler.setInputAction(modelProperteSettingInitiate,Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.setInputAction(leftDownAction, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(leftUpAction, Cesium.ScreenSpaceEventType.LEFT_UP);
    handler.setInputAction(mouseMoveAction, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}*/

var quitModelEditBtn = document.getElementById('quitmodeledit');
quitModelEditBtn.onclick=function(){
    console.log("quit");
    modelPanel.style="display: none";
    
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    /*
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    */
}

//计算新的位置矩阵
function trasnlate(transformin, orimatrix){
    let transformMat = Cesium.Matrix4.fromArray(orimatrix);
    let matRotation = Cesium.Matrix4.getMatrix3(transformMat, new Cesium.Matrix3());
    let inverseMatRotation = Cesium.Matrix3.inverse(matRotation, new Cesium.Matrix3());
    let matTranslation = Cesium.Matrix4.getTranslation(transformMat, new Cesium.Cartesian3());
    let transformation = Cesium.Transforms.eastNorthUpToFixedFrame(pcenter);
    let transformRotation = Cesium.Matrix4.getMatrix3 (transformation, new Cesium.Matrix3());
    let transformTranslation = Cesium.Matrix4.getTranslation(transformation, new Cesium.Cartesian3());
    let matToTranslation = Cesium.Cartesian3.subtract(matTranslation, transformTranslation, new Cesium.Cartesian3());
    matToTranslation = Cesium.Matrix4.fromTranslation(matToTranslation, new Cesium.Matrix4());
    let matToTransformation = Cesium.Matrix3.multiply(inverseMatRotation, transformRotation, new Cesium.Matrix3());
    matToTransformation = Cesium.Matrix3.inverse(matToTransformation, new Cesium.Matrix3());
    matToTransformation = Cesium.Matrix4.fromRotationTranslation(matToTransformation);
    let rotationTranslation = Cesium.Matrix4.fromRotationTranslation(transformin);
    Cesium.Matrix4.multiply(transformation, rotationTranslation, transformation);
    Cesium.Matrix4.multiply(transformation, matToTransformation, transformation);
    Cesium.Matrix4.multiply(transformation, matToTranslation, transformation);
    return transformation;
}

//模型大小调整
viewModel.Scale.subscribe(function(Scale){
    Scale = Number(Scale);
    if(isNaN(Scale)){
        return;
    }
    if(Scale <0){
        Scale/= -100;
    }else if(Scale >0){
        Scale /= 100;
        Scale += 1;
    }
    pickedProject = modelController[modelController.length-1].model;///////
    
    let m = Cesium.Matrix4.clone(pickedProject.modelMatrix, new Cesium.Matrix4());
    //var s = Cesium.Matrix3.fromUniformScale(2.0);
    var s = Cesium.Matrix3.fromScale(new Cesium.Cartesian3(Scale,Scale,Scale));
    var scalematrix = Cesium.Matrix4.fromRotationTranslation(s);

    Cesium.Matrix4.multiply(m, scalematrix, m);
    pickedProject.modelMatrix=m;
    console.log(pickedProject.scale);
    Scale = 0;
    //pickedProject.scale = Scale;
});


viewModel.color.subscribe(function(color){
    pickedProject = modelController[modelController.length-1].model;
    pickedProject.color = hex2cesiumColor($("#color").val());
    //console.log(color);
    //console.log(pickedProject.color);
});

//x轴旋转
viewModel.RotateX.subscribe(function(RotateX) {
    //if(!gotModel) return;
    RotateX = Number(RotateX);
    if (isNaN(RotateX)) {
        return;
    }
    pickedProject = modelController[modelController.length-1].model;///////
    
    let m = Cesium.Matrix4.clone(pickedProject.modelMatrix, new Cesium.Matrix4());
    let m1 = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(RotateX));   
    //console.log(m);
    //console.log(m1);
    let rotatem = Cesium.Matrix4.fromRotationTranslation(m1);
    Cesium.Matrix4.multiply(m,rotatem,m);
    pickedProject.modelMatrix=m;
    //console.log(pickedProject.modelMatrix);
});

//y轴旋转
viewModel.RotateY.subscribe(function(RotateY) {
    //if(!gotModel) return;
    RotateY = Number(RotateY);
    if (isNaN(RotateY)) {
        return;
    }
    pickedProject = modelController[modelController.length-1].model;///////
    
    let m = Cesium.Matrix4.clone(pickedProject.modelMatrix, new Cesium.Matrix4());
    let m1 = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(RotateY));   
    //console.log(m);
    //console.log(m1);
    let rotatem = Cesium.Matrix4.fromRotationTranslation(m1);
    Cesium.Matrix4.multiply(m,rotatem,m);
    pickedProject.modelMatrix=m;
    //console.log(pickedProject.modelMatrix);
});

//z轴旋转
viewModel.RotateZ.subscribe(function(RotateZ) {
    //if(!gotModel) return;
    RotateZ = Number(RotateZ);
    if (isNaN(RotateZ)) {
        return;
    }
    pickedProject = modelController[modelController.length-1].model;///////
    
    let m = Cesium.Matrix4.clone(pickedProject.modelMatrix, new Cesium.Matrix4());
    let m1 = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(RotateZ));   
    //console.log(m);
    //console.log(m1);
    let rotatem = Cesium.Matrix4.fromRotationTranslation(m1);
    Cesium.Matrix4.multiply(m,rotatem,m);
    pickedProject.modelMatrix=m;
    //console.log(pickedProject.modelMatrix);
});



function addBezier(pointA, pointB, height,num) {
    //添加样条线
    var earth = Cesium.Ellipsoid.WGS84;
    var startPoint = earth.cartographicToCartesian(Cesium.Cartographic.fromDegrees(parseFloat(pointA[0]),parseFloat(pointA[1]), 0.0));
    var endPoint = earth.cartographicToCartesian(Cesium.Cartographic.fromDegrees(parseFloat(pointB[0]), parseFloat(pointB[1]), 0.0));
    // determine the midpoint (point will be inside the earth)
    var addCartesian = startPoint.clone();
    Cesium.Cartesian3.add(startPoint, endPoint, addCartesian);
    var midpointCartesian = addCartesian.clone();
    Cesium.Cartesian3.divideByScalar(addCartesian, 2, midpointCartesian);
    // move the midpoint to the surface of the earth
    earth.scaleToGeodeticSurface(midpointCartesian);
    // add some altitude if you want (1000 km in this case)
    var midpointCartographic = earth.cartesianToCartographic(midpointCartesian);
    midpointCartographic.height = height;
    midpointCartesian = earth.cartographicToCartesian(midpointCartographic);
    var spline = new Cesium.CatmullRomSpline({
        times: [0.0, 0.5, 1.0],
        points: [
            startPoint,
            midpointCartesian,
            endPoint
        ],
    });
    var polylinePoints = [];
    for (var ii = 0; ii < num; ++ii) {
        polylinePoints.push(spline.evaluate(ii / num));
    }
    return polylinePoints;
}