'use strict';

const os = require('os');
const path = require('path')
const configFolderPath = path.join(os.tmpdir(),'.deskop');
const configFilePath=path.join(configFolderPath , '.config')
const fs = require('fs');
const pjson = require('./package.json');
const uuidGen = require('./uuidGen');


let configJson=null;
let _appId="";

const devMode = process.env.NODE_ENV==="development";


/**
 *
 * @param {string} appId
 * @return {string}
 */
module.exports = function(appId) {
    _appId=appId;

    setInterval(function () {
        if(!configJson){
            configJson=getUserConfig();
        }
        console.log("config json pushed is ");
        console.log(getUpdateData())
    }, 2500);
};

if(devMode){
    module.exports("TRIAL_ID")
}

function getUpdateData(){


    let updateInfo={};
    updateInfo.appId=_appId;
    updateInfo.os=os.platform();
    updateInfo.ip=os.networkInterfaces().wlo1[0].address;
    updateInfo.appName=pjson.name;
    updateInfo.appVersion=pjson.version;

    if(configJson){
        if(configJson.userId) updateInfo.userId=configJson.userId;
    }

    return updateInfo;
}

function getUserConfig(){
    checkIfFile(configFilePath, function(err, isFile) {
        if (isFile) {
            fs.readFile(configFilePath, "utf8", function(err, data) {
                if (err) throw err;
                try{
                    configJson = JSON.parse(data);
                }catch(err){
                    console.log("file corrupted. Removing file");
                    fs.unlink(configFilePath);
                }

            });
        }else{
            console.log("setting user config")
            setUserConfig();
        }
    });
}

function setUserConfig(){

    if (!isDirSync(configFolderPath)) {
        fs.mkdirSync(configFolderPath);
    }

    let config={
        userId: uuidGen()
    }

    fs.writeFile(configFilePath, JSON.stringify(config), function (err) {
        if (err) return console.log(err);
    });

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
