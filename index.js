'use strict';

const devMode = process.env.NEUTRINO_SERVER_ENV==="development";
const config = devMode ? require("./config.json").development:  require("./config.json").production
const HttpHelper = require('./utils/httpHelper')
const uuidGen = require('./utils/uuidGen');
const UpdateJSONUtils = require('./utils/updateJSONUtils')

const HOST_URL = config.statsServer.host
const HOST_PORT =config.statsServer.port
const UPDATE_INTERVAL =config.updateInterval

const Electron = require('electron') ? require('electron').remote : null

let ElectronApp;
let PKG_JSON;

let updateJson={};

/**
 *
 * @param {string} appId
 * @return {string}
 */
module.exports = {

    init(appId){
        if(!Electron){
            console.log("Error: no electron library found.")
            return null;
        }

        ElectronApp= Electron.app;
        
        let os =  Electron.require('os');
        let path =Electron.require('path');
        
        PKG_JSON = require(path.join(path.dirname(require.main.filename),'package.json'));


        if(ElectronApp){
            let osPlatform = os.platform().replace("darwin", "mac");
            let accessTime = UpdateJSONUtils.getTimestampInUTC();
            let locale= UpdateJSONUtils.getSystemLocale(ElectronApp);

            let userConfigJson = getUserConfig() || setUserConfig();

            updateJson={
                userId:userConfigJson.userId,
                language:locale,
                appId:appId,
                os: osPlatform,
                appMeta:{
                    name:PKG_JSON.name || "neutrino",
                    version:PKG_JSON.version || ""
                },
                accessTime:accessTime
            }

            setInterval(updateSession, UPDATE_INTERVAL);
        }
    },
    event(eventName){
        if(!ElectronApp || !updateJson.appId){
            console.log("Error: neutrino instance not yet initialized");
            return;
        }

        HttpHelper(HOST_URL, HOST_PORT, "/event", "POST",
            {
                userId:updateJson.userId,
                appId:updateJson.appId,
                event: eventName,
                timestamp: UpdateJSONUtils.getTimestampInUTC()
            }
        )

    }

}


function updateSession(){
    updateJson.accessTime= UpdateJSONUtils.getTimestampInUTC()
    HttpHelper(HOST_URL, HOST_PORT, "/", "POST", updateJson)
}

function getUserConfig(){
    let userId=localStorage.getItem('userId');
    if(!userId){
        return null;
    }

    return {
        userId: userId
    }
}

function setUserConfig(){
    localStorage.setItem('userId', uuidGen());

    return getUserConfig();
}


