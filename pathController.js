class PathController{
    cameraNodeList = [];
    constructor(){

    }

    interpolation(){
        let len = this.cameraNodeList.length;
        let rate = 0.5/len;
        let posList = [];
        for(let i = 0; i < len; i ++){
            let p = [
                this.cameraNodeList[i].longitude,this.cameraNodeList[i].latitude
            ]
            posList.push(p);
        }
        let spline = new Spline(posList,4);
        let splist = [];
        for(let i = 0; i <= 1; i += rate){
            spline.ptForT(i);
            splist.push(spline.calculatedpt);
        }
        console.log(splist);
    }

    getDist(pointA, pointB){
        let posA = Cesium.Cartesian3.fromDegrees(pointA.longitude,pointA.latitude,pointA.height);
        let posB = Cesium.Cartesian3.fromDegrees(pointB.longitude,pointB.latitude,pointB.height);
        let vecAB = Cesium.Cartesian3.subtract(posB, posA, new Cesium.Cartesian3());
        return Cesium.Cartesian3.distance(posA,posB);
    }

    //计算旋转矩阵
    GetTargeMM(pointA, pointB) {
        //获取AB向量
        let vecAB = Cesium.Cartesian3.subtract(pointB, pointA, new Cesium.Cartesian3());
        //归一化
        let normalAB = Cesium.Cartesian3.normalize(vecAB, new Cesium.Cartesian3());
        //计算旋转矩阵
        let rotationMatrix3 = Cesium.Transforms.rotationMatrixFromPositionVelocity(pointA, normalAB);
        let modelMatrix4 = Cesium.Matrix4.fromRotationTranslation(rotationMatrix3, pointA);
        return modelMatrix4;
    }

    //计算rph
    getRPH(rotateMatrix){
        let sy = Math.sqrt(rotateMatrix[0] * rotateMatrix[0] + rotateMatrix[4] * rotateMatrix[4] );
        let singular = sy < 1e-6;
        let x,y,z;
        if(!singular){
            x = Math.atan2(rotateMatrix[9],rotateMatrix[10]);
            y = Math.atan2(-rotateMatrix[8],sy);
            z = Math.atan2(rotateMatrix[4],rotateMatrix[0]);
        }else{
            x = Math.atan2(-rotateMatrix[6],rotateMatrix[5]);
            y = Math.atan2(-rotateMatrix[8],sy);
            z = 0;
        }
        return {
            roll: x*(180.0/Math.PI),
            pitch: y*(180.0/Math.PI),
            heading: z*(180.0/Math.PI)
        }
    }

    //设置相机参数
    setCameraParameter(_position, cType, target){
        //console.log(_position);
        //console.log(target);
        let oriPosition = _position;
        let pos = Cesium.Cartesian3.fromDegrees(_position.longitude,_position.latitude,_position.height); 
        let tgt = Cesium.Cartesian3.fromDegrees(target.longitude,target.latitude,target.height);
        let rotateMatrix = this.GetTargeMM(pos,tgt);
        let rph = this.getRPH(rotateMatrix);
        let distance = Number($("#distance").val());
        let angle = Number($("#angle").val());
        let speed = Number($("#speed").val());
        let duration = speed/4;
        //console.log(rph);
        let p = new CameraNode(
            oriPosition.latitude,
            oriPosition.longitude,
            2000,
            rph.heading-90,
            3-rph.pitch,
            0,
            duration,
            tgt
        );
        console.log(p);
        let nextp = new CameraNode(oriPosition.latitude,
            oriPosition.longitude,
            2000,
            rph.heading-90,
            3-rph.pitch,
            0,
            duration,
            tgt
        );
        switch(cType){
            case 0:{
                let vec = Cesium.Cartesian3.subtract(tgt,pos, new Cesium.Cartesian3());              
                vec = Cesium.Cartesian3.multiplyByScalar(vec,distance/10,new Cesium.Cartesian3());
                pos = Cesium.Cartesian3.add(pos,vec,new Cesium.Cartesian3());
                ellipsoid = viewer.scene.globe.ellipsoid;
                let cartographic = ellipsoid.cartesianToCartographic(pos);
                nextp.longitude = Cesium.Math.toDegrees(cartographic.longitude);
                nextp.latitude = Cesium.Math.toDegrees(cartographic.latitude);
                
                break;
            }
                
            case 1:{
                //拉
                let vec = Cesium.Cartesian3.subtract(pos,tgt, new Cesium.Cartesian3());
                vec = Cesium.Cartesian3.multiplyByScalar(vec,distance/10,new Cesium.Cartesian3());
                pos = Cesium.Cartesian3.add(pos,vec,new Cesium.Cartesian3());
                ellipsoid = viewer.scene.globe.ellipsoid;
                let cartographic = ellipsoid.cartesianToCartographic(pos);
                nextp.longitude = Cesium.Math.toDegrees(cartographic.longitude);
                nextp.latitude = Cesium.Math.toDegrees(cartographic.latitude);
                //this.cameraNodeList.push(p);
                break;
                }
            case 2:{
                //摇
                nextp.heading += parseInt(angle);
                break;
            }
            case 3:{
                //移
                let vec = Cesium.Cartesian3.subtract(pos,tgt, new Cesium.Cartesian3());
                vec = Cesium.Cartesian3.cross(vec,new Cesium.Cartesian3(distance/10,distance/10,distance/10),new Cesium.Cartesian3());
                pos = Cesium.Cartesian3.add(pos,vec,new Cesium.Cartesian3());
                ellipsoid = viewer.scene.globe.ellipsoid;
                let cartographic = ellipsoid.cartesianToCartographic(pos);
                nextp.longitude = Cesium.Math.toDegrees(cartographic.longitude);
                nextp.latitude = Cesium.Math.toDegrees(cartographic.latitude);
                //this.cameraNodeList.push(p);
                break;
            }
            case 4:{
                //升降
                nextp.height += parseInt(distance);
                break;
            }
            default:
                console.log("default");
                break;
        };
        this.cameraNodeList.push(p);
        this.cameraNodeList.push(nextp);
        console.log(this.cameraNodeList);
        return false;
    }
}