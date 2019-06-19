//подключение библиотек
var http = require('http');
var static = require('node-static');
var {parse} = require('querystring');

const low = require('lowdb');  //база данных
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

const express = require("express");  //использование framework
const app = express();  //создание объекта приложения
const port = 3000;  //сервер 3000
const server = http.createServer(app);  //создание простого http сервера

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

db.defaults({ objects: [] }).write();  //первичная установка базы данных на хранение массива объектов objects

app.use("/index(.html)?", express.static(__dirname + "/public"));  //статический файловый сервер
app.get("*/api", function (req, res)
{
    res.send('API is running');
});
server.listen(port, function ()
{
   console.log("Server listening on port " + port);  //прослушивание подключения на порту 3000
});

wss.on('connection', function connection(ws)  //при соединении клиента с сервером
{
    ws.send('Loading Data from server');  //отправка сообщения с сервера при подключении

    var length = db.get('objects').size().value();  //количество объектов в базе данных
    for (var i = 0; i < length; i++)  //отправка хранимых данных клиенту с сервера при подключении
    {
        var msg = db.get('objects[' + i +']').value();  //тип данных - SavedData с прошлого захода
        ws.send(JSON.stringify({dataType: "SavedData", data: msg}));
        console.log("SavedData was sent");
        console.log(msg);
    }

    ws.on('message', function incoming(event)  //при получении сообщения от клиента
    {
        console.log('Message was received: %s', event);
        if (isJsonString(event) == true)  //получены данные в виде JSON строки для удаления или записи и синхронизации
        {
            var message = JSON.parse(event);  //входящие данные
            var msg = message.data;
            console.log(msg);
            if (message.dataType == "DeletedData")  //удаление данных из базы, если элемент отсутствует у клиента
            {
                db.get('objects').remove(msg).write();
            }
            else  //добавление или обновление данных в базе
            {
                var object = {
                    tagname: msg.tagname,
                    name: msg.name,
                }  //формирование объекта поиска, комбинация tagname и name уникальная
                if (db.get('objects').find(object).value())  //если объект уже был записан в базу данных
                    db.get('objects')  //замена объекта с уникальным значением комбинации tagname и name
                        .find(object)
                        .assign(msg)
                        .write();
                else  //добавление нового объекта в базу данных
                    db.get('objects')
                        .push(msg)
                        .write();
                ws.send(event);  //отправка данных для синхронизации обратно клиенту
            }
        }
    });

    ws.on('close', function()  //при закрытии клиента
    {
        console.log('Connection is closed by client');
    });
});

function isJsonString(str)  //проверка, возможно ли распарсить строку из JSON формата строки
{
    try
    {
        JSON.parse(str);
    }
    catch (e)
    {
        return false;
    }
    return true;
}