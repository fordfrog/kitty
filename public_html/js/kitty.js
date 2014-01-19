/**
 * Copyright 2014 Miroslav Šulc
 */

var nodeFs = require("fs"), nodePath = require("path"),
        supportedExtensions = [], extensionHandlers = {}, _document;

function openTopDirDialog() {
    var dialog = _document.querySelector("#btnOpenTopDirHelper");
    dialog.addEventListener("change", setTopDir, false);
    dialog.click();
}

function setTopDir(event) {
    var files = event.target.files, dirTreeContent, li, span, file;

    if (files.length === 0) {
        return;
    }

    file = files[0];

    dirTreeContent = _document.querySelector("#dir-tree-content");
    dirTreeContent.innerHTML = "";

    li = _document.createElement("li");
    span = _document.createElement("span");
    li.appendChild(span);
    span.appendChild(_document.createTextNode(file.name));
    span.setAttribute("data-path", file.path);
    span.title = file.path;
    dirTreeContent.appendChild(li);

    readSubDirs(li, file.path);
}

function readSubDirs(parentElement, path) {
    nodeFs.readdir(path, function(err, files) {
        loadSubDirs(err, files, path, parentElement);
    });
}

function loadSubDirs(err, files, path, parentElement) {
    var i, file, filePath, dirs = [], dir, ul, li, span;

    if (err !== null) {
        return;
    }

    for (i = 0; i < files.length; i++) {
        file = files[i];
        filePath = nodePath.resolve(path, file);

        if (nodeFs.statSync(filePath).isDirectory()) {
            dirs.push(filePath);
        }
    }

    if (dirs.length === 0) {
        return;
    }

    ul = _document.createElement("ul");
    parentElement.appendChild(ul);

    for (i = 0; i < dirs.length; i++) {
        dir = dirs[i];
        li = _document.createElement("li");
        span = _document.createElement("span");
        li.appendChild(span);
        span.appendChild(_document.createTextNode(nodePath.basename(dir)));
        span.setAttribute("data-path", dir);
        span.title = dir;
        ul.appendChild(li);

        readSubDirs(li, dir);
    }
}

function loadSubDir(err, stat, path, parentElement) {
    if (err !== null || !stat.isDirectory()) {
        return;
    }
}

exports.init = function(document) {
    _document = document;

    _document.querySelector("#btnOpenTopDir").addEventListener("click",
            openTopDirDialog, false);
};