
module.exports={
    getTimestampInUTC:function(){
        let accessTime = new Date()
        return  (new Date(accessTime.getTime()- accessTime.getTimezoneOffset()*60000)).toISOString()
    },
    getSystemLocale:function(ElectronApp){
        if(ElectronApp){
            let fullLocale=ElectronApp.getLocale();
            return fullLocale.split("-")[0] || ""
        }else{
            return ""
        }
    }
}