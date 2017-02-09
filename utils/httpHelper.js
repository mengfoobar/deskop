let http;


module.exports={
    init:function(Electron){
        http = Electron.require('http')
    },
    request:function(url, port, path, method, body){
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
            res.on('data', (chunk) => {});
            res.on('end', () => {});
        });

        req.on('error', (e) => {});

        req.write(postData);
        req.end();
    }
}

