var dirOfPath;
var dirOfCameraModel;
var dirOfconfig;
var dirOfModel;
var dirOfProject;

var jsonData;
var txtData;

//读取txt格式文本
function readTxt(txtPath){
    var request = new XMLHttpRequest();
    request.open('GET', txtPath, false);
    request.send(null);
    if (request.status === 200) {
        txtData=request.response;
        //console.log(txtData);
    }
}

//txt文件标准化
function txtCast(txtContent){
    let positionList=[];
    let txtlist = txtContent.replace( /\r/g, " " ).split( " " );
    let cnt = txtlist.length/2;
    for(let i = 0; i < cnt; i += 2){
        let position = {
            latitude: txtlist[i],
            longitude: txtlist[i+1]
        }
        positionList.push(position);
    }
    return JSON.stringify(positionList);
}

//读取json格式文件
function readJson(jsonURL= "positions.json"){
    var request = new XMLHttpRequest();
    request.open('GET', jsonURL, false);
    request.send(null);
    if (request.status === 200) {
        jsonData=JSON.parse(request.responseText);
        //console.log(jsonData);
    }
}

//文件读取接口
function readFile(filePath){
    if(".txt" == filePath.substr(-4)){
        //读取txt文件
        readTxt(filePath);
        //console.log(txtData);
        jsonData=txtCast(txtData);
    }else if(".json" == filePath.substr(-5)){
        //读取json文件
        readJson(filePath);
        //console.log(jsonData);
        
    }
    return jsonData;
}



//for test
/*
var url = "positions.txt";
var testbtn = document.getElementById('test');
testbtn.onclick=function(){
    console.log(readFile(url));
}
*/

