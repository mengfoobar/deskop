'use strict';

const devMode = process.env.NODE_ENV==="development";
const HOST_URL = devMode? "127.0.0.1" : "52.54.16.223"
const HOST_PORT =3000
const UpdateInterval = devMode? 8000 : 30000

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
const configFolderPath = path.join(os.homedir(), "."+AppName);
const configFilePath=path.join(configFolderPath , '.config')

let configJson=null;
let updateJSON={};


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

    updateJSON={
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

    setInterval(updateSession, UpdateInterval);
};

function updateSession(){
    if(!configJson){
        getUserConfig()
            .then(function(result){
                if(result){
                    configJson = result;
                    updateJSON.userId=configJson.userId;
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
        updateJSON.accessTime= UpdateJSONUtils.getTimestampInUTC()
        HttpHelper(HOST_URL, HOST_PORT, "/project", "POST", updateJSON)
    }
}

function getUserConfig(){
    return FileIOUtils.checkIfFileExist(configFilePath)
        .then(function(result){
            if(result){
                return FileIOUtils.readJSONFromFile(configFilePath)
            }else{
                return Promise.resolve(false)
            }
        })
}

function setUserConfig(){

    let config={
        userId: uuidGen()
    }

    return FileIOUtils.ensureFolderExist(configFolderPath)
        .then(function(result){
            if(!result){
                return Promise.resolve(false)
            }
            return FileIOUtils.writeJSONToFile(configFilePath, config)
        })
}


