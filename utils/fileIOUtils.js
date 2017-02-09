


module.exports={
    readJSONFromFile:function(electron, path){
        const fs = electron.require('fs');
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
    checkIfFileExist:function(electron, path){
        const fs = electron.require('fs');

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
    }

}