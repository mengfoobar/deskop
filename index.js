'use strict';

const devMode = process.env.NEUTRINO_SERVER_ENV==="development";
const config = devMode ? require("./config.json").development:  require("./config.json").production
const HttpHelper = require('./utils/httpHelper')
const uuidGen = require('./utils/uuidGen');
const UpdateJSONUtils = require('./utils/updateJSONUtils');
const FileIOUtils = require('./utils/fileIOUtils')


const HOST_URL = config.statsServer.host
const HOST_PORT =config.statsServer.port
const UPDATE_INTERVAL =config.updateInterval

const Electron = require('electron') ? require('electron').remote : null

let ElectronApp;
let PKG_JSON;
let os;


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
            let appName=PKG_JSON.name || "neutrino"

            updateJson={
                userId:"",
                language:locale,
                appId:appId,
                os: osPlatform,
                appMeta:{
                    name:PKG_JSON.name || "neutrino",
                    version:PKG_JSON.version || ""
                },
                accessTime:accessTime
            }

            let userConfigJson = getUserConfig(appId);

            if(!userConfigJson){
                getUserConfigFromSettingsFile(appName)
                    .then(function(result){
                        if(result && result.userId){
                            userConfigJson= setUserConfig(appId, result.userId)
                        } else{
                            userConfigJson = setUserConfig(appId)
                        }
                        updateJson.userId=userConfigJson.userId;
                        setInterval(updateSession, UPDATE_INTERVAL);
                    })
                    .catch(function(err){
                        console.log(err.message)
                    })
            }else{
                updateJson.userId=userConfigJson.userId;
                setInterval(updateSession, UPDATE_INTERVAL);
            }

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

function getUserConfig(appId){
    let configStr=localStorage.getItem(appId);
    let configJSON=null;

    if(configStr){
        try{
            configJSON=JSON.parse(configStr)
        }catch(err){
            configJSON=null;
        }
    }

    return configJSON;
}

function setUserConfig(appId, userId=null){
    let configJson = {
        userId:userId || uuidGen()
    }

    localStorage.setItem(appId, JSON.stringify(configJson));
    return getUserConfig(appId);
}

function getUserConfigFromSettingsFile(appName){

    let path =Electron.require('path');
    let os =  Electron.require('os');

    const userConfigFolderPath = path.join(os.homedir(), "."+appName);
    const userConfigFilePath=path.join(userConfigFolderPath , '.config')

    return FileIOUtils.checkIfFileExist(userConfigFilePath)
        .then(function(result){
            if(result){
                return FileIOUtils.readJSONFromFile(userConfigFilePath)
            }else{
                return Promise.resolve(false)
            }
        })
}

