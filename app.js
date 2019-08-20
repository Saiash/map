let http = require('http');
let fs = require('fs');
let qs = require('querystring');
let db = require('./db');
let serverDataManager = require('./POST_manager');

let game = {};   
//db.save('images', {id: 54, server: 1, name: "карта", type: 'map1', src: 'https://cdn.glitch.com/1e2a731d-04e4-4cc3-b1c4-9f51297def54%2Fmymap.jpg?v=1561616606766'});
/*db.load('images', function(data) { 
  console.log(data);
},{0:['server','=','3']}); */

http.createServer((request, response) => {  
    if (request.method === 'POST') {
        let body = ''; 
        request.on('data', (data) => {
            body += data;
            if (body.length > 1e6)  {
                request.connection.destroy();
            } 
        }); 
      
        request.on('end', () => { 
            //Magic happens here.
            //post data are shilded by slashes
            //we need to remove slashes and keep new lines
            let result = JSON.stringify(qs.parse(body)).split('\\n').join('{n}').split('\\')
                                                       .join('').split('{n}').join('\\n')
                                                       .split('"image":"').join('"image":')
                                                       .split(',"className":"Image"}"').join(',"className":"Image"}');
            //last symblos are corrapted, removing them aswell
            result = result.substr(2,result.length-7);
            result = JSON.parse(result);
          
            serverDataManager[result.method](result, game, response);
        });        

    } else {
        response.writeHeader(200, {"Content-Type": "text/html"}); 
        let homePageUrls = ['/',''];
        if (homePageUrls.indexOf(request.url) != -1) {
            request.url = "/index.html";
        }
        fs.readFile(__dirname+request.url, (err, data) => {
            if (err) {
                throw err; 
            }
            response.write(data);
            response.end();  
        });
    }
}).listen(8000);    