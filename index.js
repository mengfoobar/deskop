'use strict';

const devMode = process.env.NODE_ENV==="development";
const HOST_URL = devMode? "127.0.0.1" : "52.54.16.223"
const HOST_PORT =3000
const UpdateInterval = devMode? 8000 : 30000

const os = require('os');
const path = require('path')
const fs = require('fs');
const electronApp = require('electron').app;

const FileIOUtils = require('./utils/fileIOUtils')
const HttpHelper = require('./utils/httpHelper')
const uuidGen = require('./utils/uuidGen');

const appDir = path.dirname(require.main.filename);
const pjson = require(path.join(appDir,'package.json'));
const AppName = pjson.name || "neutrino"
const configFolderPath = path.join(os.homedir(), "."+AppName);
const configFilePath=path.join(configFolderPath , '.config')

let configJson=null;
let _appId="";


/**
 *
 * @param {string} appId
 * @return {string}
 */
module.exports = function(appId) {
    _appId=appId;
    setInterval(updateSession, UpdateInterval);
};

function updateSession(){
    if(!configJson){
        getUserConfig()
            .then(function(result){
                if(result){
                    configJson = result;
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
        HttpHelper(HOST_URL, HOST_PORT, "/project", "POST", getUpdateData())
    }
}

function getUpdateData(){

    let updateInfo={};

    if(configJson){
        if(configJson.userId) updateInfo.userId=configJson.userId;
    }else{
        return;
    }

    if(electronApp){
        let locale=electronApp.getLocale()
        if(locale){
            updateInfo.language= locale.split("-")[0]
        }
    }

    updateInfo.appId=_appId;
    updateInfo.os=os.platform();
    if(updateInfo.os==="darwin"){
        updateInfo.os="mac";
    }

    if(pjson){
        updateInfo.appMeta={
            name:pjson.name,
            version:pjson.version
        }
    }

    let accessTime = new Date()
    updateInfo.accessTime = (new Date(accessTime.getTime()- accessTime.getTimezoneOffset()*60000)).toISOString()

    return updateInfo;
}

function getUserConfig(){
    return FileIOUtils.checkIfFileExist(configFilePath)
        .then(function(result){
            console.log(`result of checking if file exist is ${result}`)
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

