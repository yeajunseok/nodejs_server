var http = require('http'); //git test입니다.
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js'); // 모듈을 갖고 올 떄는 requiret사용한다.
var path = require('path');
var sanitizeHtml = require('sanitize-html'); //node_modules이 모듈에서 sanitize-html를 찾는다.

var app = http.createServer(function(request,response){ //request에는 웹브라우저가 보낸 정보들, response 응답할떄 우리가 웹 브라우저에게 보낼 정보들
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;

    if(pathname === '/') {
      if(queryData.id === undefined) {
        fs.readdir('./data', function(error, filelist) {
          var title = 'Welcoml';
          var de = 'Hello, Node.js';
          var list = template.list(filelist); //객체를 통해서
          var html = template.html(title,list,`<h2>${title}</h2>${de}`, `<a href="/create">create</a>`);
          response.writeHead(200);
          response.end(html);
        })
      } else {
        fs.readdir('./data', function(error, filelist) {
          var filteredId = path.parse(queryData.id).base; //입력정보에 대한 보안
          fs.readFile(`data/${filteredId}`, 'utf8', function(err, de){ //data/${queryData.id}를 읽어서, 내용을 functiond의 de에 놔둔다. console.log(de); 하면 de 내용이 찍힌다.
            var title = queryData.id;
            var sanitizedTitle = sanitizeHtml(title); //이렇게 함으로써 소독해준다.
            var sanitizeDescription = sanitizeHtml(de); //본문에 스크립트 태그가 같이 따라오면 살슌 해줌
            var list = template.list(filelist);
            var html = template.html(sanitizedTitle,list,`<h2>${sanitizedTitle}</h2>${sanitizeDescription}`,
              `<a href="/create">create</a>
               <a href="/update?id=${sanitizedTitle}">update</a>
               <form action="delete_process" method="post" >
                <input type="hidden" name="id" value="${sanitizedTitle}">
                <input type="submit" value="delete">
              </form>
              `
            );
            response.writeHead(200);
            response.end(html);
          });
        });
      }
    } else if(pathname === '/create') {
      fs.readdir('./data', function(error, filelist) {
        var title = 'Web-create';
        var list = template.list(filelist);
        var html = template.html(title,list,`
          <form action="http://localhost:3000/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
          `, ``); //post방식으로  create_process로 데이터 넘김
        response.writeHead(200);
        response.end(html);
      })
    } else if(pathname === '/create_process') {
      var body='';  //post형식으로 받은 데이터를 이렇게 받는다.
      request.on('data', function(data) { //request에는 웹브라우저가 보낸 정보들이있다, 요청한 정보안에 post정보가 있기 때문이다.
        body = body + data;
      });
      request.on('end', function() {
        var post = qs.parse(body);
        /*
        console.log(post); //결과값: { title: 'Nodejs', description: 'Nodejs is...' }
        console.log(post.title); //결과값: Nodejs
        console.log(post.description); // 결과값: Nodejs is ...
        */
        var title = post.title;
        var de = post.description;

        fs.writeFile(`data/${title}`, de, 'utf8', function(err) { //파일로 저장된다.
          response.writeHead(302, {Location: `/?id=${title}`}); //리다이렉션, 사용자가 create_process에서 다른 페이지로 팅겨저 버리는거... 302는 페이지를 다른 쪽으로 리다이렉션 하는것.
          response.end();
        })
      });
    } else if (pathname === '/update') {
      fs.readdir('./data', function(error, filelist) {
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function(err, de){ //data/${queryData.id}를 읽어서, 내용을 functiond의 de에 놔둔다. console.log(de); 하면 de 내용이 찍힌다.
          var title = queryData.id;
          var list = template.list(filelist);
          var html = template.html(title,list,
            `
            <form action="http://localhost:3000/update_process" method="post">
              <input type"hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${de}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form> `,
            `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`);
          response.writeHead(200);
          response.end(html);
        });
      });
    } else if (pathname === "/update_process") {
      var body='';  //post형식으로 받은 데이터를 이렇게 받는다.
      request.on('data', function(data) { //request에는 웹브라우저가 보낸 정보들이있다, 요청한 정보안에 post정보가 있기 때문이다.
        body = body + data;
      });
      request.on('end', function() {
        var post = qs.parse(body);
        var id = post.id;
        var title = post.title;
        var de = post.description;
        fs.rename(`data/${id}`, `data/${title}`, function(error) { //oldname, newname,
          fs.writeFile(`data/${title}`, de, 'utf8', function(err) { //파일로 저장된다.
            response.writeHead(302, {Location: `/?id=${title}`}); //리다이렉션, 사용자가 create_process에서 다른 페이지로 팅겨저 버리는거... 302는 페이지를 다른 쪽으로 리다이렉션 하는것.
            response.end();
          })
        })
      });
    } else if (pathname === "/delete_process") {
      var body='';  //post형식으로 받은 데이터를 이렇게 받는다.
      request.on('data', function(data) { //request에는 웹브라우저가 보낸 정보들이있다, 요청한 정보안에 post정보가 있기 때문이다.
        body = body + data;
      });
      request.on('end', function() {
        var post = qs.parse(body);
        var id = post.id;
        var filteredId = path.parse(id).base;
        fs.unlink(`data/${filteredId}`, function(err) {
          response.writeHead(302, {Location: `/`}); //리다이렉션, 사용자가 create_process에서 다른 페이지로 팅겨저 버리는거... 302는 페이지를 다른 쪽으로 리다이렉션 하는것.
          response.end();
        })
      });
    } else {
      response.writeHead(404);
      response.end('Not found');
    }

});
app.listen(3000);
