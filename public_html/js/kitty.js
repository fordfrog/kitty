/**
 * Copyright 2014 Miroslav Šulc
 */

var nodeFs = require("fs"), nodePath = require("path"),
        exiftool = require("./commands/exiftool.js"), supportedExtensions = [],
        extensionHandlers = {}, _document;

/**
 * Opens file dialog for selection of top directory.
 */
function openTopDirDialog() {
    var dialog = _document.querySelector("#btnOpenTopDirHelper");
    dialog.addEventListener("change", setTopDir, false);
    dialog.click();
}

/**
 * Sets top directory as selected in the directory selection dialog.
 *
 * @param {Event} event event from the dialog
 */
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

    readDirectoryContent(li, file.path);
}

/**
 * Reads directory content and fires loading of related info.
 *
 * @param {Element} parentElement parent element where to append the info
 * @param {String} path directory path
 */
function readDirectoryContent(parentElement, path) {
    nodeFs.readdir(path, function(err, files) {
        loadDirectoryContent(err, files, path, parentElement);
    });
}

/**
 * Loads directory content into the directory tree.
 *
 * @param {Error} err command error
 * @param {Array} files list of files in the parent directory
 * @param {String} path path of the parent directory
 * @param {Element} parentElement parent element where to append info
 */
function loadDirectoryContent(err, files, path, parentElement) {
    var i, file, filePath, dirs = [], dir, ul, li, span, filesCount = 0, stat;

    if (err !== null) {
        return;
    }

    for (i = 0; i < files.length; i++) {
        file = files[i];
        filePath = nodePath.resolve(path, file);
        stat = nodeFs.statSync(filePath);

        if (stat.isDirectory()) {
            dirs.push(filePath);
        } else if (stat.isFile() && exiftool.isFileRecognized(file)) {
            filesCount++;
        }
    }

    parentElement.firstChild.appendChild(_document.createTextNode(" ("
            + filesCount + ")"));

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

        readDirectoryContent(li, dir);
    }
}

/**
 * Initializes the application.
 *
 * @param {Document} document application document
 */
exports.init = function(document) {
    _document = document;

    _document.querySelector("#btnOpenTopDir").addEventListener("click",
            openTopDirDialog, false);
};