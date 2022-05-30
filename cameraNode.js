class CameraNode{
    longitude;
    latitude;
    height;
    heading;
    pitch;
    roll;
    duration;
    target;
    constructor(latitude, longitude, height, heading, pitch, roll, duration, target){
        //console.log(latitude);
        this.latitude = latitude;
        this.longitude = longitude;
        this.height = height;
        if(heading == undefined){
            heading = 0;
        }
        this.heading = heading;
        if(pitch == undefined){
            pitch = 0;
        }
        this.pitch = pitch;
        if(roll == undefined){
            roll = 0;
        }
        this.roll = roll;
        if(duration == undefined){
            duration = 4;
        }
        this.duration = duration;
        this.target = target;
    }
}