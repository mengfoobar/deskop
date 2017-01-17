const http = require('http');

let lock = false;


module.exports=function(url, port, path, method, body){
    if(lock){
       return;
    }
    lock=true;
    const postData = JSON.stringify(body);

    const options = {
        host: url,
        port: port,
        path: path,
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('end', () => {
            lock=false;
        });
    });

    req.on('error', (e) => {
        lock=false;
    });

    req.write(postData);
    req.end();
}

