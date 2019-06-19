var leftForm = document.getElementById("left_form");  //левая форма
var rightForm = document.getElementById("right_form");  //правая форма

for (var i = 0; i < leftForm.children.length; i++)  //копирование элементов левой формы в правую
{
    var cloneElement = leftForm.children[i].cloneNode(true);
    cloneElement.setAttribute("readonly", "readonly");
    rightForm.appendChild(cloneElement);
}

var textElems = leftForm.querySelectorAll('input[type=text]');  //все text
for (var i = 0; i < textElems.length; i++)  //при снятии фокуса отправка данных на сервер
{
    textElems[i].addEventListener("mouseout", function() {if (socket.readyState == 1) sendElemsData(this);});
}

var textareaElems = leftForm.getElementsByTagName('textarea');  //все теги textarea
for (var i = 0; i < textareaElems.length; i++)  //при снятии фокуса отправка данных на сервер
{
    textareaElems[i].addEventListener("mouseout", function() {if (socket.readyState == 1) sendElemsData(this);});
}

var checkboxElems = leftForm.querySelectorAll('input[type=checkbox]');  //все checkbox
for (var i = 0; i < checkboxElems.length; i++)  //при клике отправка данных на сервер
{
    checkboxElems[i].addEventListener("click", function() {if (socket.readyState == 1) sendElemsData(this);});
}

var radioElems = leftForm.querySelectorAll('input[type=radio]');  //все radio
for (var i = 0; i < radioElems.length; i++)  //при клике отправка данных на сервер
{
    radioElems[i].addEventListener("click", function() {if (socket.readyState == 1) sendElemsData(this);});
}

var selectElems = leftForm.getElementsByTagName('select');  //все select
for (var i = 0; i < selectElems.length; i++)  //при снятии фокуса отправка данных на сервер
{
    selectElems[i].addEventListener("mouseout", function() {if (socket.readyState == 1) sendElemsData(this);});
}

var buttonElems = leftForm.getElementsByTagName('button');  //все кнопки в форме с тегом button
for (var i = 0; i < buttonElems.length; i++)
{
    buttonElems[i].addEventListener("click", function() {
        changeButtonColor(this);
        if (socket.readyState == 1)
            sendElemsData(this);
    });  //при клике любая кнопка меняет цвет и отправляются данные на сервер, если соединение открыто
}

var inputButtonElems = leftForm.querySelectorAll("input[type=button]");  //все кнопки в форме с тегом input и типом button
for (var i = 0; i < inputButtonElems.length; i++)
{
    inputButtonElems[i].addEventListener("click", function() {
        changeButtonColor(this);
        if (socket.readyState == 1)
            sendElemsData(this);
    });  //при клике любая кнопка меняет цвет и отправляются данные на сервер, если соединение открыто
}



function changeButtonColor(e)  //смена цвета кнопки
{
    if (e.className == "pressedButton")  //кнопка была в нажатом состоянии
        e.className = "unpressedButton";
    else  //кнопка была в отжатом состоянии
        e.className = "pressedButton";
}

function sendElemsData(e)  //отправить данные изменённого элемента на сервер
{
    //формирование сообщения, у всех элементов обязательно должен быть tagname и name, причём их комбинация уникальна
    var msg = {
        tagname: e.nodeName.toLowerCase(),  //тег
        name: e.name,  //имя, атрибут name
    };

    if (msg.tagname == "button")  //проверка, так как значение для тега button хранится внутри
        msg["value"] = e.textContent;
    else if (msg.tagname != "select")  //у объекта select не хранится значение
        msg["value"] = e.value;

    if (msg.tagname == "select")  //у выпадающего списка есть массив хранимых опций
    {
        var opts = [];  //массив вариантов выбора, хранящийся в раскрывающемся списке
        for (var i = 0; i < e.children.length; i++)
        {
            opts[i] = createMessageOption(e.children[i]);
        }
        msg["options"] = opts;
    }
    
    var attribs = {};  //формирование списка атрибутов (остальных, неглавных, то есть кроме name и value)
    for(var a of e.attributes)
    {
        if (a.name != "name"  &&  a.name != "value")
            attribs[a.name] = e.getAttribute(a.name);
    }
    if (e.type == "checkbox"  ||  e.type == "radio")  //элементы, которые имеют свойство быть отмеченными
        attribs.checked = e.checked;
    msg["attributes"] = attribs;

    console.log(msg);
    socket.send(JSON.stringify({dataType: "UpgradeData", data: msg}));  //отправка объекта как JSON-строки
}

function createMessageOption(e)  //формирование объекта опции раскрывающегося списка
{
    var opt = {};
    for(var a of e.attributes)
    {
        opt[a.name] = e.getAttribute(a.name);
    }
    opt["selected"] = e.selected;
    console.log(opt);
    return opt;
}
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



var socket = new WebSocket("ws://localhost:3000");  //создать подключение

socket.onopen = function()  //при открытии соединения
{
    console.log('Connected');
};

socket.onmessage = function(event)  //обработчик входящих сообщений
{
    console.log("Message was received");
    if (isJsonString(event.data) == true)  //получены данные строка JSON для синхронизации
    {
        var message = JSON.parse(event.data);  //входящие данные
        var left_element = findElement(message.data, leftForm);
        if (left_element != null  &&  (message.dataType == "SavedData"  ||  message.dataType == "UpgradeData"))  //у клиента есть объект, хранимый в базе данных
        {
            if (message.dataType == "SavedData")  //получены сохранённые данные закрытого ранее клиента
            {
                console.log("SavedData was received");  //копирование данных в левую форму
                console.log(message.data);
                assignData(message.data, left_element);
            }
            assignData(message.data, findElement(message.data, rightForm));  //копирование данных в правую форму
        }
        else  //объект не найден, отправка на сервер этих же данных типом DeletedData, которые нужно удалить из базы данных
        {
            socket.send(JSON.stringify({dataType: "DeletedData", data: message.data}));  //отправка отсутствующих данных
        }
    }
};

function findElement(msg, n_form)  //вернуть элемент из формы n_form, для которого предназначено msg сообщение
{
    if (msg.attributes.type == "radio")  //если элемент - radiobutton, то поиск его единственного отмеченного значения
    {
        var element = n_form.querySelectorAll(msg.tagname + "[name=" + msg.name + "]");  //поиск объекта, для которого получены данные
        if (element == null)
            return element;  //элемент не найден
        for (var i = 0; i < element.length  &&  element[i].value != msg.value; i++)  //поиск единственного отмеченного значения для radiobutton
        { }
        element = element[i];
    }
    else
        var element = n_form.querySelector(msg.tagname + "[name=" + msg.name + "]");  //поиск объекта, для которого получены данные
    return element;  //возвращает null, если элемент не найден
}
function assignData(msg, element)  //сохранить данные в соответствующем элементе формы n_form, полученные от сервера
{
    element.name = msg["name"];  //запись имени
    if (element.hasAttribute("value"))  //если значение хранится внутри тега, а не в атрибуте или свойстве
        element.value = msg["value"];  //запись значения
    else if (msg.tagname != "select")  //у раскрывающегося списка значение хранится в опциях, это отдельный случай
        element.textContent = msg["value"];
    if (msg.tagname == "select")  //если элемент - раскрывающийся список
    {
        for (var i = 0; i < element.children.length; i++)
            assignOptionData(msg["options"][i], element.children[i]);
    }
    for (var k in msg.attributes)  //перебрать остальные атрибуты из сообщения, ключ = k, значение = msg.attributes[k]
    {
        if (k == "checked")  //для объектов, имеющих свойство быть отмеченными checked
            element.checked = msg.attributes[k];
        else
            element.setAttribute(k, msg.attributes[k]);
    }
}
function assignOptionData(opt, child)  //сохранить данные для опции child из раскрывающегося списка, полученные из сообщения opt
{
    for (var k in opt)  //перебрать все атрибуты в объекте
    {
        if (k == "selected")  //selected задаётся свойством, а не атрибутом
            child.selected = opt[k];
        else
            child.setAttribute(k, opt[k]);
    }
}

socket.onerror = function(error)  //при ошибке
{
    console.log("Error: " + error.message);
};

socket.onclose = function()  //при закрытии соединения
{
    console.log('Disconnected');  //сервер был закрыт
};