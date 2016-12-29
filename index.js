'use strict';

const os = require('os');
const path = require('path')
const fs = require('fs');
const HttpHelper = require('./httpHelper')

const appDir = path.dirname(require.main.filename);

const configFolderPath = path.join(os.tmpdir(),'.deskop');
const configFilePath=path.join(configFolderPath , '.config')

const pjson = require(path.join(appDir,'package.json'));
const uuidGen = require('./uuidGen');

let configJson=null;
let _appId="";

const electronApp = require('electron').app;

const devMode = process.env.NODE_ENV==="development";

console.log(configFilePath)

/**
 *
 * @param {string} appId
 * @return {string}
 */
module.exports = function(appId) {
    _appId=appId;

    setInterval(function () {

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
            HttpHelper(getUpdateData())
            console.log(getUpdateData())
        }

    }, 15000);
};

if(devMode){
    module.exports("TRIAL_ID")
}

function getUpdateData(){


    let updateInfo={};

    if(configJson){
        if(configJson.userId) updateInfo.userId=configJson.userId;
    }else{
        return;
    }

    if(electronApp){
        updateInfo.language=electronApp.getLocale()
    }


    updateInfo.appId=_appId;
    updateInfo.os=os.platform();

    let netWorkInterface=os.networkInterfaces();
    if(netWorkInterface.eth0 && netWorkInterface.eth0[0]){
        updateInfo.ip=netWorkInterface.eth0[0].address;
    }else if(os.networkInterfaces().wlo1 && os.networkInterfaces().wlo1[0]){
        updateInfo.ip=netWorkInterface.wlo1[0].address;
    }else{
        updateInfo.ip=null;
    }

    if(pjson){
        updateInfo.appMeta={
            name:pjson.name,
            version:pjson.version
        }
    }



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
