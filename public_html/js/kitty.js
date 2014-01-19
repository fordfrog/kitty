/**
 * Copyright 2014 Miroslav Šulc
 */

var nodeFs = require("fs"), nodePath = require("path"), nodeOS = require("os"),
        exiftool = require("./commands/exiftool.js"),
        preview = require("./preview.js"), supportedExtensions = [],
        extensionHandlers = {}, _document, selectedDirectoryElement,
        appTmpDir = nodePath.resolve(nodeOS.tmpdir(), "kitty"),
        imgTmpDir = nodePath.resolve(appTmpDir, "images"),
        previewMaxWidth = 300, previewMaxHeight = 300;

if (!nodeFs.existsSync(appTmpDir)) {
    nodeFs.mkdirSync(appTmpDir);
}

if (!nodeFs.existsSync(imgTmpDir)) {
    nodeFs.mkdirSync(imgTmpDir);
}

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
    var files = event.target.files, dirTreeContent, li, file;

    if (files.length === 0) {
        return;
    }

    file = files[0];

    dirTreeContent = _document.querySelector("#dir-tree-content");
    dirTreeContent.innerHTML = "";

    li = createDirectoryTreeElement(file.path);
    dirTreeContent.appendChild(li);

    readDirectoryContent(li, file.path);

    loadDirectoryFiles(file.path, li.firstChild);
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
    var i, file, filePath, dirs = [], dir, ul, li, filesCount = 0, stat;

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
        li = createDirectoryTreeElement(dir);
        ul.appendChild(li);

        readDirectoryContent(li, dir);
    }
}

/**
 * Creates directory tree element.
 *
 * @param {String} dirPath directory path
 *
 * @returns {Element} created element
 */
function createDirectoryTreeElement(dirPath) {
    var li, span;

    li = _document.createElement("li");
    span = _document.createElement("span");
    li.appendChild(span);
    span.appendChild(_document.createTextNode(nodePath.basename(dirPath)));
    span.setAttribute("data-path", dirPath);
    span.title = dirPath;
    span.addEventListener("click", onSelectDirectory, false);

    return li;
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

    nodeFs.readdir(path, function(err, files) {
        showDirectoryFiles(err, path, files);
    });
}

/**
 * Shows directory files in the content part of the window.
 *
 * @param {Error} err command error
 * @param {String} dirPath directory path
 * @param {Array} files array of file names
 */
function showDirectoryFiles(err, dirPath, files) {
    var content, i, file, element, previewElement, span;

    if (err !== null) {
        return;
    }

    content = _document.querySelector("#content");
    content.innerHTML = "";

    preview.clearQueue();
    clearImageCache();

    for (i = 0; i < files.length; i++) {
        file = files[i];

        if (!exiftool.isFileRecognized(file)) {
            continue;
        }

        previewElement = _document.createElement("div");
        previewElement.className = "preview";
        span = _document.createElement("span");
        span.appendChild(_document.createTextNode("Loading preview..."));
        previewElement.appendChild(span);

        element = _document.createElement("div");
        element.className = "file-info";
        element.appendChild(previewElement);
        element.appendChild(_document.createTextNode(files[i] + " "));
        content.appendChild(element);

        createPreview(nodePath.resolve(dirPath, file), previewElement);
    }
}

/**
 * Deletes all images in the image cache. The function returns after all images
 * are deleted.
 */
function clearImageCache() {
    var files = nodeFs.readdirSync(imgTmpDir), i;

    for (i = 0; i < files.length; i++) {
        nodeFs.unlinkSync(nodePath.resolve(imgTmpDir, files[i]));
    }
}

/**
 * Attempts to create preview for the specified file.
 *
 * @param {String} filePath file path
 * @param {Element} previewElement element where to put the generated preview
 */
function createPreview(filePath, previewElement) {
    preview.createPreview(filePath, previewElement, imgTmpDir, previewMaxWidth,
            previewMaxHeight);
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