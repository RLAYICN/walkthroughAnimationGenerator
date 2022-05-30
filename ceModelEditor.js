var priPanel = document.getElementById('primitives');
var entityControllers = [];
var priModel = viewer.entities.add(new Cesium.Entity());
var perspective = document.getElementById("perspectiveProperties");

var entityType = document.getElementById("entityType");
entityType.onchange=function(){
    let selected = entityType.selectedIndex;
    //console.log(selected);
    console.log($("#entityType").val());

}

function hexToRgba(hex, opacity) {
	let rgbaArry = []
	opacity.forEach(item => {
		rgbaArry.push(
			`rgba(${parseInt('0x'+hex.slice(1, 3))}
            ,${parseInt('0x'+hex.slice(3, 5))}
            ,${parseInt('0x'+hex.slice(5, 7))},${item})`
		)
	})
	return rgbaArry
}

//console.log(colorTransform("#CC00FF"));

function colorTransform(sHex, alpha = 1) {
    let reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    //16进制颜色转为RGB格式
    let sColor = String(sHex).toLowerCase();
    if (sColor && reg.test(sColor)) {
        if (sColor.length === 4) {
            let sColorNew = '#';
            for (let i = 1; i < 4; i += 1) {
                sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
            }
            sColor = sColorNew;
        }
        // 处理六位的颜色值
        let sColorChange = [];
        for (let i = 1; i < 7; i += 2) {
            sColorChange.push(parseInt(`0x${sColor.slice(i, i + 2)}`));
        }
        sColorChange.push(alpha);
        //console.log(sColorChange);
        return sColorChange;
    }
    return sColor
}


$("#mcolor").change(function(){
    console.log(hex2cesiumColor($("#mcolor").val()));
})

$("#outlineColor").change(function(){
    console.log(hex2cesiumColor($("#outlineColor").val()));
})

function hex2cesiumColor(hex){
    let rgba = colorTransform(hex);
    let cartesian = Cesium.Cartesian4.fromArray(rgba);
    let cesiumColor = Cesium.Color.fromCartesian4(cartesian);
    return cesiumColor;
}

$("#createEntity").click(function(){
    let modelPosition;
    //alert("请选择位置");
    handler.setInputAction(function(event){
        let ellipsoid = viewer.scene.globe.ellipsoid;
        let position=viewer.camera.pickEllipsoid(event.position,ellipsoid);
        let cartographic = ellipsoid.cartesianToCartographic(position);
        let modelTargetPosition={
            longitude: Cesium.Math.toDegrees(cartographic.longitude),
            latitude: Cesium.Math.toDegrees(cartographic.latitude),
        }
        let radius =  Number($("#radius").val());
        console.log(modelTargetPosition);
        modelPosition = JSON.parse(JSON.stringify(Cesium.Cartesian3.fromDegrees (modelTargetPosition.longitude,modelTargetPosition.latitude, radius , ellipsoid)));
        //console.log(modelTargetPosition);
        modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
            Cesium.Cartesian3.fromDegrees(modelTargetPosition.longitude,modelTargetPosition.latitude,0,ellipsoid)
        );
        createEntityByType($("#entityType").val(),modelPosition);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);//移除对左单击事件的处理
    },Cesium.ScreenSpaceEventType.LEFT_CLICK);
    
})

$("#editEntity").click(function(){
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
})


$("#quitEntityEdit").click(function(){
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
})

function createEntityByType(typeIndex, modelPosition){
    typeIndex = Number(typeIndex);
    if(isNaN(typeIndex)) return;
    let id = entityControllers.length;
    switch(typeIndex){
        case 0:{
            //生成点
            createPoint(modelPosition,priModel,id,2);
            break;
        }
        case 1:{
            createRectangle(modelPosition,priModel,id);
            break;
        }
        case 2:{
            createLabel(modelPosition,priModel,id);
            break;
        }
        case 3:{
            createCylinder(modelPosition,priModel,id);
            break;
        }
        case 4:{
            createEllipsoid(modelPosition,priModel,id);
            break;
        }
        default: break;
    }
}


//绘制点
function createPoint(pos, _parent, pindex, type){

    //properties = ["pixelSize","color","outlineColor","outlineWidth",
    //"scaleByDistance","translucencuByDistance","distanceDisplayCondition"]
    //type{
    //    "cameraTrack":0,
    //    "targetPoint":1,
    //    "userDefinedPoint":2,
    //}
    console.log(pos);
    if(2 == type){
        //用户定义点
        let entityController = new EntityController();
        let pixelSize = Number($("#pixelSize").val());
        let outlineWidth = Number($("#outlineWidth").val());
        let color = hex2cesiumColor($("#mcolor").val());
        let outlineColor = hex2cesiumColor($("#outlineColor").val());
        let sbd = new Cesium.NearFarScalar(
            Number($("#snear").val()),
            Number($("#snearVal").val()),
            Number($("#sfar").val()),
            Number($("#sfarVal").val())
        );
        let tbd = new Cesium.NearFarScalar(
            Number($("#tnear").val()),
            Number($("#tnearVal").val()),
            Number($("#tfar").val()),
            Number($("#tfarVal").val())
        );
        let ddc = new Cesium.DistanceDisplayCondition(
            Number($("#dnear").val())
        );
        
        if(0 == sbd.far){
            sbd = null;
        }
        if(0 == tbd.far){
            tbd = null;
        }
        if(0 < Number($("#dfar").val())){
            ddc.far = Number($("#dfar").val());
        }
        entityController.entity = new Cesium.Entity({
            id: pindex.toString(),
            position: pos,
            parent: _parent,
            point:{
                pixelSize: pixelSize,
                color: color,
                outlineColor: outlineColor,
                outlineWidth: outlineWidth,
                scaleByDistance: sbd,
                translucencuByDistance: tbd,
                distanceDisplayCondition: ddc,
            }
        });       
        entityControllers.push(entityController);
        viewer.entities.add(entityController.entity);

        //console.log(entityController.entity.point.color);
        //console.log(entityController.entity.point.outlineColor);
    }
    if(0 == type){
        //关节点
        
        viewer.entities.add({
            //pindex为该point实体对应的position对象在oriPositions数组中的下标
            name: pindex.toString(),
            position: pos,
            parent: _parent,
            point:{
                
                color: Cesium.Color.DARKRED,
                pixelSize: 6,
                
                scaleByDistance:{
                    near: 0.0,
                    nearValue: 6,
                    far: 50000,
                    farValue: 3,
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

//绘制矩形
function createRectangle(pos, _parent, pindex){
    console.log("rectangle");
    let entityController = new EntityController();
    let pixelSize = Number($("#pixelSize").val());
    let outlineWidth = Number($("#outlineWidth").val());
    let color = hex2cesiumColor($("#mcolor").val());
    let outlineColor = hex2cesiumColor($("#outlineColor").val());
    let sbd = new Cesium.NearFarScalar(
        Number($("#snear").val()),
        Number($("#snearVal").val()),
        Number($("#sfar").val()),
        Number($("#sfarVal").val())
    );
    let tbd = new Cesium.NearFarScalar(
        Number($("#tnear").val()),
        Number($("#tnearVal").val()),
        Number($("#tfar").val()),
        Number($("#tfarVal").val())
    );
    let ddc = new Cesium.DistanceDisplayCondition(
        Number($("#dnear").val())
    );
    
    if(0 == sbd.far){
        sbd = null;
    }
    if(0 == tbd.far){
        tbd = null;
    }
    if(0 < Number($("#dfar").val())){
        ddc.far = Number($("#dfar").val());
    }
    entityController.entity = new Cesium.Entity({
        id: pindex.toString(),
        position: pos,
        parent: _parent,
        rectangle:{
            height: pixelSize,
            color: color,
            outlineColor: outlineColor,
            outlineWidth: outlineWidth,
            scaleByDistance: sbd,
            translucencuByDistance: tbd,
            distanceDisplayCondition: ddc,
        }
    });       
    console.log(entityController.entity);
    entityControllers.push(entityController);
    viewer.entities.add(entityController.entity);

    //console.log(entityController.entity.point.color);
    //console.log(entityController.entity.point.outlineColor);
}

//绘制标签
function createLabel(pos, _parent, pindex){
    let entityController = new EntityController();
    let pixelSize = Number($("#pixelSize").val());
    pos.height = Number($("#radius").val());
    let outlineWidth = Number($("#outlineWidth").val());
    let color = hex2cesiumColor($("#mcolor").val());
    let outlineColor = hex2cesiumColor($("#outlineColor").val());
    let sbd = new Cesium.NearFarScalar(
        Number($("#snear").val()),
        Number($("#snearVal").val()),
        Number($("#sfar").val()),
        Number($("#sfarVal").val())
    );
    let tbd = new Cesium.NearFarScalar(
        Number($("#tnear").val()),
        Number($("#tnearVal").val()),
        Number($("#tfar").val()),
        Number($("#tfarVal").val())
    );
    let ddc = new Cesium.DistanceDisplayCondition(
        Number($("#dnear").val())
    );
    
    if(0 == sbd.far){
        sbd = null;
    }
    if(0 == tbd.far){
        tbd = null;
    }
    if(0 < Number($("#dfar").val())){
        ddc.far = Number($("#dfar").val());
    }
    let text = $("#content").val().toString();
    console.log(color);
    entityController.entity = new Cesium.Entity({
        id: pindex.toString(),
        position: pos,
        parent: _parent,
        label:{
            backGroundColor: outlineColor,
            backgroundPadding: outlineWidth,
            scale: pixelSize,
            text: text,
            fillColor: Cesium.Color.fromCssColorString ($("#mcolor").val().toString()),
            scaleByDistance: sbd,
            distanceDisplayCondition: ddc,
            translucencuByDistance: tbd
        }
    })
    viewer.entities.add(entityController.entity);
    entityControllers.push(entityController);
}

function createCylinder(pos, _parent, pindex){
    let entityController = new EntityController();
    let length = Number($("#pixelSize").val());
    let radius = Number($("#radius").val());
    let outlineWidth = Number($("#outlineWidth").val());
    console.log($("#mcolor").val());
    let color = hex2cesiumColor($("#mcolor").val());
    let outlineColor = hex2cesiumColor($("#outlineColor").val());
    let sbd = new Cesium.NearFarScalar(
        Number($("#snear").val()),
        Number($("#snearVal").val()),
        Number($("#sfar").val()),
        Number($("#sfarVal").val())
    );
    let tbd = new Cesium.NearFarScalar(
        Number($("#tnear").val()),
        Number($("#tnearVal").val()),
        Number($("#tfar").val()),
        Number($("#tfarVal").val())
    );
    let ddc = new Cesium.DistanceDisplayCondition(
        Number($("#dnear").val())
    );
    
    if(0 == sbd.far){
        sbd = null;
    }
    if(0 == tbd.far){
        tbd = null;
    }
    if(0 < Number($("#dfar").val())){
        ddc.far = Number($("#dfar").val());
    }
    //let text = $("#content").val().toString();
    //console.log(color);
    entityController.entity = new Cesium.Entity({
        id: pindex.toString(),
        position: pos,
        parent: _parent,
        cylinder:{
            bottomRadius: radius,
            topRadius: radius,
            outline: false,
            fill: true,
            outlineColor: outlineColor,
            outlineWidth: outlineWidth,
            length: length,
            material: Cesium.Color.fromCssColorString ($("#mcolor").val().toString()),
            shadows: Cesium.ShadowMode.CAST_ONLY,
            distanceDisplayCondition: ddc,
            heightReference: Cesium.HeightReference.NONE,
        }
    })
    // hex2cesiumColor($("#mcolor").val()),
    //entityController.entity.cylinder._color = color;
    viewer.entities.add(entityController.entity);
    entityControllers.push(entityController);
    console.log(entityController.entity.cylinder._material);
}

function createEllipsoid(pos, _parent, pindex){
    console.log("ellipsoid");
    let entityController = new EntityController();
    let pixelSize = Number($("#pixelSize").val());
    let outlineWidth = Number($("#outlineWidth").val());
    let color = hex2cesiumColor($("#mcolor").val());
    let outlineColor = hex2cesiumColor($("#outlineColor").val());
    let r = Number($("#radius").val());
    let radius = new Cesium.Cartesian3(r,r,r);
    let sbd = new Cesium.NearFarScalar(
        Number($("#snear").val()),
        Number($("#snearVal").val()),
        Number($("#sfar").val()),
        Number($("#sfarVal").val())
    );
    let tbd = new Cesium.NearFarScalar(
        Number($("#tnear").val()),
        Number($("#tnearVal").val()),
        Number($("#tfar").val()),
        Number($("#tfarVal").val())
    );
    let ddc = new Cesium.DistanceDisplayCondition(
        Number($("#dnear").val())
    );
    
    if(0 == sbd.far){
        sbd = null;
    }
    if(0 == tbd.far){
        tbd = null;
    }
    if(0 < Number($("#dfar").val())){
        ddc.far = Number($("#dfar").val());
    }
    entityController.entity = new Cesium.Entity({
        id: pindex.toString(),
        position: pos,
        parent: _parent,
        ellipsoid:{
            radii: radius,
            innderRaddi: radius,
            outline: false,
            fill: true,
            shadows: Cesium.ShadowMode.CAST_ONLY,
            material: Cesium.Color.fromCssColorString ($("#mcolor").val().toString()),
            distanceDisplayCondition: ddc,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        }
    });       
    console.log(entityController.entity._ellipsoid);
    entityControllers.push(entityController);
    viewer.entities.add(entityController.entity);

    //console.log(entityController.entity.point.color);
    //console.log(entityController.entity.point.outlineColor);
}

var cityNameList = ["合肥市","芜湖市","滁州市","阜阳市","安庆市","马鞍山市","宿州市","蚌埠市",'亳州市',"六安市","宣城市","淮南市","淮北市","铜陵市","池州市","黄山市"];
var cityPositions = [[117.27,31.86],[118.38,31.33],[118.31,32.33],[115.81,32.89],[117.03,30.52],[118.48,30.52],[116.97,33.63],
[117.34,32.93],[115.78,33.84],[116.49,31.73],[118.73,31.95],[116.98,32.62],[116.77,33.97],[117.82,30.93],[117.29,30.40],[118.34,29.71]];
var gdpList = [10045.72,4302.63,3362.1,3071.5,2656.88,2439.33,2167.7,1989,1972,1923.5,1833,1457,1223,1165,1004,957];


function drawCylinders(){
    let ellipsoid = viewer.scene.globe.ellipsoid;
    let len = cityNameList.length;
    for(let i = 0; i < len; i ++){
        let modelTargetPosition = {
            longitude:cityPositions[i][0],
            latitude:cityPositions[i][1]
        }
        console.log(cityPositions[i]);
        console.log(modelTargetPosition);
        let entityController = new EntityController();
        let id = entityControllers.length;
        let length = Number(gdpList[i]*10)
        let modelPosition = Cesium.Cartesian3.fromDegrees (modelTargetPosition.longitude,modelTargetPosition.latitude, length/2 , ellipsoid);
        let color = Cesium.Color.fromBytes(16*i,16*i,16*i,1);
        
        entityController.entity = new Cesium.Entity({
            id: id,
            position: modelPosition,
            parent: priModel,
            cylinder:{
                bottomRadius: 7500,
                topRadius: 7500,
                outline: false,
                fill: true,
                length: length,
                material: Cesium.Color.fromBytes(255,16*i,16*i,255),
                shadows: Cesium.ShadowMode.CAST_ONLY,
                heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            }
        })

        viewer.entities.add(entityController.entity);
        entityControllers.push(entityController);
        /*
        let label = new EntityController();
        id = entityControllers.length;
        let labeltext = cityNameList[i] + " " + gdpList[i].toString()+"(亿元)";
        let sbd = new Cesium.NearFarScalar(100, 10, 100000, 1)
        modelPosition = Cesium.Cartesian3.fromDegrees (modelTargetPosition.longitude,modelTargetPosition.latitude, length+4000, ellipsoid)
        label.entity = new Cesium.Entity({
            id: id,
            position: modelPosition,
            parent: priModel,
            label:{
                text: labeltext,
                scale: 0.7,
                fillColor: Cesium.Color.fromBytes(16,16,255,255),
                scaleByDistance: sbd,
                heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            }
        })
        viewer.entities.add(label.entity);
        entityControllers.push(label);*/
        //console.log(entityController.entity.cylinder._material);
    }
    //console.log(viewer.entities);
}


//drawCylinders();