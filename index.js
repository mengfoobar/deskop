'use strict';

const devMode = process.env.NODE_ENV==="development";
const config = devMode ? require("./config.json").development:  require("./config.json").production

const HOST_URL = config.statsServer.host
const HOST_PORT =config.statsServer.port
const UPDATE_INTERVAL =config.updateInterval

const os = require('os');
const path = require('path')
const fs = require('fs');

const FileIOUtils = require('./utils/fileIOUtils')
const HttpHelper = require('./utils/httpHelper')
const uuidGen = require('./utils/uuidGen');
const UpdateJSONUtils = require('./utils/updateJSONUtils')

const appDir = path.dirname(require.main.filename);
const pjson = require(path.join(appDir,'package.json'));
const AppName = pjson.name || "neutrino"
const userConfigFolderPath = path.join(os.homedir(), "."+AppName);
const userConfigFilePath=path.join(userConfigFolderPath , '.config')

let userConfigJson=null;
let updateJson={};


/**
 *
 * @param {string} appId
 * @return {string}
 */
module.exports = function(appId) {
    let osPlatform = os.platform().replace("darwin", "mac");
    let appName = pjson.name || "";
    let appVersion = pjson.version || "";
    let accessTime = UpdateJSONUtils.getTimestampInUTC();
    let locale= UpdateJSONUtils.getSystemLocale();

    updateJson={
        userId:"",
        language:locale,
        appId:appId,
        os: osPlatform,
        appMeta:{
            name:appName,
            version:appVersion
        },
        accessTime:accessTime
    }

    setInterval(updateSession, UPDATE_INTERVAL);
};

function updateSession(){
    if(!userConfigJson){
        getUserConfig()
            .then(function(result){
                if(result){
                    userConfigJson = result;
                    updateJson.userId=userConfigJson.userId;
                    return Promise.resolve(true)
                }else{
                    return setUserConfig();
                }
            })
            .then(function(result){
                if(!result){
                    throw new Error("was unable to set user config file.")
                }
            })
            .catch(function(err){
                console.log(`[neutrino] Error: ${err.message}`)
            })
    }else{
        updateJson.accessTime= UpdateJSONUtils.getTimestampInUTC()
        HttpHelper(HOST_URL, HOST_PORT, "/project", "POST", updateJson)
    }
}

function getUserConfig(){
    return FileIOUtils.checkIfFileExist(userConfigFilePath)
        .then(function(result){
            if(result){
                return FileIOUtils.readJSONFromFile(userConfigFilePath)
            }else{
                return Promise.resolve(false)
            }
        })
}

function setUserConfig(){

    let config={
        userId: uuidGen()
    }

    return FileIOUtils.ensureFolderExist(userConfigFolderPath)
        .then(function(result){
            if(!result){
                return Promise.resolve(false)
            }
            return FileIOUtils.writeJSONToFile(userConfigFilePath, config)
        })
}


