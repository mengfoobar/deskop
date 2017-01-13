'use strict';

const devMode = process.env.NODE_ENV==="development";
const HOST_URL = devMode? "127.0.0.1" : "52.54.16.223"
const HOST_PORT =3000
const UpdateInterval = devMode? 8000 : 15000

const os = require('os');
const path = require('path')
const fs = require('fs');
const electronApp = require('electron').app;

const HttpHelper = require('./httpHelper')
const uuidGen = require('./uuidGen');

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

if(devMode){
    module.exports("TRIAL_ID")
}

function updateSession(){
    if(!configJson){
        getUserConfig()
            .then(function(result){
                if(result){
                    configJson = result
                }
            })
            .catch(function(err){
                console.log(err)
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

    var accessTime = new Date()
    updateInfo.accessTime = (new Date(accessTime.getTime()- accessTime.getTimezoneOffset()*60000)).toISOString()

    return updateInfo;
}

function getUserConfig(){
    return new Promise(function(resolve, reject){
        checkIfFile(configFilePath, function(err, isFile) {
            if (isFile) {
                fs.readFile(configFilePath, "utf8", function(err, data) {
                    if (err) throw err;
                    try{
                        let configJson = JSON.parse(data);
                        resolve(configJson);
                    }catch(err){
                        console.log("file corrupted. Removing file");
                        fs.unlink(configFilePath);
                    }

                });
            }else{
                console.log("setting user config")
                setUserConfig()
                    .then(function(result){
                        if(result){
                            resolve(result)
                        }
                    })
                    .catch(function(err){
                        reject()
                    })
            }
        });
    })

}

function setUserConfig(){

    if (!isDirSync(configFolderPath)) {
        fs.mkdirSync(configFolderPath);
    }

    let config={
        userId: uuidGen()
    }

    return new Promise(function(resolve, reject){
        fs.writeFile(configFilePath, JSON.stringify(config), function (err) {
            if (err) {
                reject(err)
            }else{
                resolve(config)
            }
        });
    })


}

function isDirSync(aPath) {
    try {
        return fs.statSync(aPath).isDirectory();
    } catch (e) {
        if (e.code === 'ENOENT') {
            return false;
        } else {
            throw e;
        }
    }
}

function checkIfFile(file, cb) {
    fs.stat(file, function fsStat(err, stats) {
        if (err) {
            if (err.code === 'ENOENT') {
                return cb(null, false);
            } else {
                return cb(err);
            }
        }
        return cb(null, stats.isFile());
    });
}
