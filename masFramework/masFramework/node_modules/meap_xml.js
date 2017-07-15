var expat = require('node-expat');
//var expat = require('xml2js');
var fs = require('fs');

// This object will hold the final result.
var obj = {};
var currentObject = {};
var ancestors = [];
var currentElementName = null;

var options = {}; //configuration options
function startElement(name, attrs) {
    currentElementName = name;
    if (options.coerce) {
        // Looping here in stead of making coerce generic as object walk is unnecessary
        Object.keys(attrs).forEach(function (key) {
            attrs[key] = coerce(attrs[key]);
        });
    }

    if (!(name in currentObject)) {
        currentObject[name] = attrs;
    } else if (!(currentObject[name] instanceof Array)) {
        // Put the existing object in an array.
        var newArray = [currentObject[name]];
        // Add the new object to the array.
        newArray.push(attrs);
        // Point to the new array.
        currentObject[name] = newArray;
    } else {
        // An array already exists, push the attributes on to it.
        currentObject[name].push(attrs);
    }

    // Store the current (old) parent.
    ancestors.push(currentObject);

    // We are now working with this object, so it becomes the current parent.
    if (currentObject[name] instanceof Array) {
        // If it is an array, get the last element of the array.
        currentObject = currentObject[name][currentObject[name].length - 1];
    } else {
        // Otherwise, use the object itself.
        currentObject = currentObject[name];
    }
}

function text(data) {
    //console.log('->' + data + '<-');
    /*if (!data.trim().length) {
     return;
     }*/

    if (options.trim) {
        data = data.trim();
    }

    if (options.sanitize) {
        data = sanitize(data);
    }

    currentObject['$t'] = coerce((currentObject['$t'] || '') + data);
}

function endElement(name) {
    if (currentElementName !== name) {
        delete currentObject['$t'];
    }
    // This should check to make sure that the name we're ending 
    // matches the name we started on.
    var ancestor = ancestors.pop();
    if (!options.reversible) {
        if ((Object.keys(currentObject).length == 1) && ('$t' in currentObject)) {
            if (ancestor[name] instanceof Array) {
                ancestor[name].push(ancestor[name].pop()['$t']);
            } else {
                ancestor[name] = currentObject['$t'];
            }
        }
    }

    currentObject = ancestor;
}

function coerce(value) {
    if (!options.coerce) {
        return value;
    }

    var num = Number(value);
    if (!isNaN(num)) {
        return num;
    }

    var _value = value.toLowerCase();

    if (_value == 'true' || _value == 'yes') {
        return true;
    }

    if (_value == 'false' || _value == 'no') {
        return false;
    }

    return value;
}


/**
 * Simple sanitization. It is not intended to sanitize
 * malicious element values.
 *
 * character | escaped
 *      <       &lt;
 *      >       &gt;
 *      (       &#40;
 *      )       &#41;
 *      #       &#35;
 *      &       &amp;
 *      "       &quot;
 *      '       &apos;
 */
var chars = {
    '<': '&lt;',
    '>': '&gt;',
    '(': '&#40;',
    ')': '&#41;',
    '#': '&#35;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;'
};

function sanitize(value) {
    if (typeof value !== 'string') {
        return value;
    }

    Object.keys(chars).forEach(function (key) {
        value = value.replace(key, chars[key]);
    });

    return value;
}

/**
 * Parses xml to json using node-expat.
 * @param {String|Buffer} xml The xml to be parsed to json.
 * @param {Object} _options An object with options provided by the user.
 * The available options are:
 *  - object: If true, the parser returns a Javascript object instead of
 *            a JSON string.
 *  - reversible: If true, the parser generates a reversible JSON, mainly
 *                characterized by the presence of the property $t.
 *  - sanitize_values: If true, the parser escapes any element value in the xml
 * that has any of the following characters: <, >, (, ), #, #, &, ", '.
 *
 * @return {String|Object} A String or an Object with the JSON representation
 * of the XML.
 */
function toJson(xml, _options) {

    //var parseString = require('xml2js').parseString;


    var parser = new expat.Parser('UTF-8');

    parser.on('startElement', startElement);
    parser.on('text', text);
    parser.on('endElement', endElement);

    obj = currentObject = {};
    ancestors = [];
    currentElementName = null;

    options = {
        object: false,
        reversible: false,
        coerce: true,
        sanitize: true,
        trim: true
    };

    for (var opt in _options) {
        options[opt] = _options[opt];
    }

    if (!parser.write(xml)) {
        throw new Error('[meap_xml][toJson][ERROR]:There are errors in your xml file: ' + parser.getError());
    }

    if (options.object) {
        return obj;
    }

    var json = JSON.stringify(obj);

    //See: http://timelessrepo.com/json-isnt-a-javascript-subset
    json = json.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

    return json;
};


function toXml(json, xml) {
    var xml = xml || '';
    if (json instanceof Buffer) {
        json = json.toString();
    }

    var obj = null;
    if (typeof(json) == 'string') {
        try {
            obj = JSON.parse(json);
        } catch (e) {
            throw new Error("[meap_xml][toXml][ERROR]:The JSON structure is invalid");
        }
    } else {
        obj = json;
    }

    var keys = Object.keys(obj);
    var len = keys.length;

    // First pass, extract strings only
    for (var i = 0; i < len; i++) {
        var key = keys[i];
        if (typeof(obj[key]) == 'string') {
            if (key == '$t') {
                xml += obj[key];
            } else {
                xml = xml.replace(/>$/, '');
                xml += ' ' + key + '="' + obj[key] + '">';
            }
        }
    }

    // Second path, now handle sub-objects and arrays
    for (var i = 0; i < len; i++) {
        var key = keys[i];

        if (Array.isArray(obj[key])) {
            var elems = obj[key];
            var l = elems.length;
            for (var j = 0; j < l; j++) {
                xml += '<' + key + '>';
                xml = toXml(elems[j], xml);
                xml += '</' + key + '>';
            }
        } else if (typeof(obj[key]) == 'object') {
            xml += '<' + key + '>';
            xml = toXml(obj[key], xml);
            xml += '</' + key + '>';
        }
    }

    return xml;
};

function parseproperties(uri, encoding, str) {
    var encoding = encoding == null ? 'UTF-8' : encoding;  //定义编码类型
    try {
        var content = uri ? fs.readFileSync(uri, encoding) : str;
        var regexjing = /\s*(#+)/;  //去除注释行的正则
        var regexkong = /\s*=\s*/;  //去除=号前后的空格的正则
        var keyvalue = {};  //存储键值对

        var arr_case = null;
        var regexline = /.+/g;  //匹配换行符以外的所有字符的正则
        while (arr_case = regexline.exec(content)) {  //过滤掉空行
            if (!regexjing.test(arr_case)) {  //去除注释行
                keyvalue[arr_case.toString().split(regexkong)[0]] = arr_case.toString().split(regexkong)[1];  //存储键值对
                //console.log(arr_case.toString());
            }
        }
    } catch (e) {
        //e.message  //这里根据自己的需求返回
        return null;
    }
    return keyvalue;
}


//exports.getAllFiles = getAllFiles;
exports.parseproperties = parseproperties;
exports.toJson = toJson;
exports.toXml = toXml;
