const electronApp = require('electron').app;


module.exports={
    getTimestampInUTC:function(){
        let accessTime = new Date()
        return  (new Date(accessTime.getTime()- accessTime.getTimezoneOffset()*60000)).toISOString()
    },
    getSystemLocale:function(){
        if(electronApp){
            let fullLocale=electronApp.getLocale();
            return fullLocale.split("-")[0] || ""
        }else{
            return ""
        }
    }
}