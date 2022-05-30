class GltfModelController{
    constructor(
        id, url, modelMatrix, 
        minimumPixelSize, maximumScale,
        color, scale,distanceDisplayCondition,
        silhouetteColor, silhouetteSize, colorBlendMode, colorBlendAmount, model
    ){
        
        this.url = url;
        this.modelMatrix = modelMatrix;
        this.scale = scale;
        this.minimumPixelSize = minimumPixelSize;
        this.maximumScale = maximumScale;
        this.id = id;
        this.distanceDisplayCondition = distanceDisplayCondition;
        this.color = color;
        this.colorBlendMode = colorBlendMode;
        this.colorBlendAmount = colorBlendAmount;
        this.sihouetteColor = silhouetteColor;
        this.silhouetteSize = silhouetteSize;
        console.log(color);
        this.model = new Cesium.Model.fromGltf({
            id: id,
            url: url,
            modelMatrix: modelMatrix,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            scene: viewer.scene,
            color: color,
            debugWireframe : false,
            maximumScale: 200
        });
        if(minimumPixelSize != undefined){
            this.model.minimumPixelSize = this.minimumPixelSize;
        }
        if(maximumScale  != undefined){
            this.model.maximumScale = maximumScale;
        }
        if(color  != undefined){
            this.model.color = color;
        }
        //tobecontinue...
    }
    move(matrix){
        let m = this.model.modelMatrix;
        this.model.modelMatrix = Cesium.Matrix4.multiplyByMatrix3(m,matrix,new Cesium.Matrix4());
        return this.model;
    }

    
}