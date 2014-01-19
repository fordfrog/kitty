/**
 * Copyright 2014 Miroslav Šulc
 */

var nodeFs = require("fs"), nodePath = require("path"),
        exiftool = require("./commands/exiftool.js"), supportedExtensions = [],
        extensionHandlers = {}, _document, selectedDirectoryElement;

/**
 * Opens file dialog for selection of top directory.
 */
function openTopDirDialog() {
    var dialog = _document.querySelector("#btnOpenTopDirHelper");
    dialog.addEventListener("change", onTopDirDialogClose, false);
    dialog.click();
}

/**
 * Sets top directory as selected in the directory selection dialog.
 *
 * @param {Event} event event from the dialog
 */
function onTopDirDialogClose(event) {
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
    span.addEventListener("click", onSelectDirectory, false);
    dirTreeContent.appendChild(li);

    readDirectoryContent(li, file.path);

    loadDirectoryFiles(file.path, span);
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
        span.addEventListener("click", onSelectDirectory, false);
        ul.appendChild(li);

        readDirectoryContent(li, dir);
    }
}

/**
 * Fired when directory is selected in the directory tree.
 *
 * @param {Event} event the selection event
 */
function onSelectDirectory(event) {
    var directoryElement = event.target,
            path = directoryElement.getAttribute("data-path");

    loadDirectoryFiles(path, directoryElement);
}

/**
 * Loads the files in the specified directory.
 *
 * @param {String} path directory path
 * @param {Element} directoryElement directory element from the directory tree
 */
function loadDirectoryFiles(path, directoryElement) {
    if (selectedDirectoryElement) {
        selectedDirectoryElement.className = "";
    }

    selectedDirectoryElement = directoryElement;
    directoryElement.className = "selected";

    nodeFs.readdir(path, showDirectoryFiles);
}

/**
 * Shows directory files in the content part of the window.
 *
 * @param {Error} err command error
 * @param {Array} files array of file names
 */
function showDirectoryFiles(err, files) {
    var content, i, file, element, preview;

    if (err !== null) {
        return;
    }

    content = _document.querySelector("#content");
    content.innerHTML = "";

    for (i = 0; i < files.length; i++) {
        file = files[i];

        if (!exiftool.isFileRecognized(file)) {
            continue;
        }

        preview = _document.createElement("div");
        preview.className = "preview";
        preview.appendChild(_document.createTextNode("No preview"));

        element = _document.createElement("div");
        element.className = "file-info";
        element.appendChild(preview);
        element.appendChild(_document.createTextNode(files[i] + " "));
        content.appendChild(element);
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