const fs = require('fs');


module.exports={
    readJSONFromFile:function(path){
        return new Promise(function(resolve, reject){
            fs.readFile(path, "utf8", function(err, data) {
                if (err) {
                    console.log(`[neutrino] Error: was unable to access config file in ${path}`)
                    resolve(false);
                }

                try{
                    let configJson = JSON.parse(data);
                    resolve(configJson);
                }catch(err){
                    console.log(`[neutrino] Error: file is corrupted. File at ${path} is being removed`)
                    fs.unlink(path);
                    resolve(false);
                }

            });
        })
    },
    writeJSONToFile:function(path, json){
        return new Promise(function(resolve, reject){
            fs.writeFile(path, JSON.stringify(json), function (err) {
                if (err) {
                    resolve(false)
                }else{
                    resolve(true)
                }
            });
        })
    },
    checkIfFileExist:function(path){
        return new Promise(function(resolve, reject){
            try{
                fs.stat(path, function fsStat(err, stats) {
                    if (err) {
                        if (err.code === 'ENOENT') {
                            resolve(false)
                        } else {
                            console.log(`[neutrino] Error: encountered error when attempting to verify path. ${err}`)
                            resolve(false)
                        }
                    }else if(!stats){
                        resolve(false)
                    }else{
                        resolve(stats.isFile()) ;
                    }

                });
            }catch(err){
                resolve(false)
            }

        })
    },
    ensureFolderExist:function(path){
        return checkIfFolderExists(path)
            .then(function(result){
                if(result){
                    return Promise.resolve(true)
                }else{
                    return createFolder(path)
                }
            })
            .then(function(result){
                return Promise.resolve(result)
            })
            .catch(function(err){
                console.log(`[neutrino] Error: encountered error when attempting to create folder. ${err.message}`)
                return Promise.resolve(false)
            })
    }

}



function checkIfFolderExists(path){
    return new Promise(function(resolve, reject) {
        try {
            fs.stat(path, function (err, stats) {
                if (err || !stats) {
                    if (err.code === 'ENOENT') {
                        resolve(false)
                    } else {
                        console.log(`[neutrino] Error: encountered error when attempting to verify path. ${err}`)
                        resolve(false)
                    }
                }else{
                    resolve(stats.isDirectory());
                }
            });
        } catch (err) {
            resolve(false)
        }
    })
}

function createFolder(path){
    return new Promise(function(resolve, reject){
        try{
            fs.mkdir(path, function (err) {
                if (err) {
                    resolve(false)
                }else{
                    resolve(true)
                }
            })
        }catch(err){
            resolve(false)
        }

    })
}