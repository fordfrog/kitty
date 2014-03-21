/**
 * Copyright 2014 Miroslav Šulc
 */

var nodeFs = require("fs"), nodePath = require("path"), nodeOS = require("os"),
        exiftool = require("./commands/exiftool.js"),
        preview = require("./preview.js"), supportedExtensions = [],
        extensionHandlers = {}, _document, selectedDirectoryElement,
        appTmpDir = nodePath.resolve(nodeOS.tmpdir(), "kitty"),
        imgTmpDir = nodePath.resolve(appTmpDir, "images"),
        previewMaxWidth = 300, previewMaxHeight = 300, rootPath, tree,
        selectedFileElement;

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
    var files = event.target.files, dirTreeContent;

    if (files.length === 0) {
        return;
    }

    rootPath = files[0].path;
    readDirectoryTree();

    dirTreeContent = _document.querySelector("#dir-tree-content");
    dirTreeContent.innerHTML = "";

    displayDirectoryTree(dirTreeContent, tree);
    readFiles(tree, function() {
        loadDirectoryFiles(tree);
    });

    readFilesRecursively(tree);
}

/**
 * Reads whole directory tree from the root path.
 */
function readDirectoryTree() {
    tree = {
        path: rootPath,
        name: nodePath.basename(rootPath),
        dirs: []
    };

    readSubDirectories(tree);
}

/**
 * Reads parent subdirectories recursively and adds them to the parent.
 *
 * @param {Object} parent parent directory object
 */
function readSubDirectories(parent) {
    var files, i, file, stats, fullPath, subDirectory;

    files = nodeFs.readdirSync(parent.path);

    for (i = 0; i < files.length; i++) {
        file = files[i];
        fullPath = nodePath.resolve(parent.path, file);
        stats = nodeFs.statSync(fullPath);

        if (stats.isDirectory()) {
            subDirectory = {
                path: fullPath,
                name: file,
                dirs: []
            };
            parent.dirs.push(subDirectory);

            readSubDirectories(subDirectory);
        }
    }
}

/**
 * Reads files recursively into each sub-directory object.
 *
 * @param {Object} dirObject directory object
 */
function readFilesRecursively(dirObject) {
    var i, subDir;

    for (i = 0; i < dirObject.dirs.length; i++) {
        subDir = dirObject.dirs[i];
        readFiles(subDir);
        readFilesRecursively(subDir);
    }
}

/**
 * Reads files for the specified directory object.
 *
 * @param {Object} dirObject directory object
 * @param {Function} handler handler to be called after files are read
 */
function readFiles(dirObject, handler) {
    exiftool.readDir(dirObject.path, function(error, stdout, stderr) {
        readFilesHandler(dirObject, error, stdout, stderr, handler);
    });
}

/**
 * Handler for reading files.
 *
 * @param {Object} dirObject directory object
 * @param {String} error error message
 * @param {String} stdout standard output
 * @param {String} stderr error output
 * @param {Function} handler handler to be called after files are read
 */
function readFilesHandler(dirObject, error, stdout, stderr, handler) {
    var data, i, item, textElement;

    if (stdout) {
        data = JSON.parse(stdout);
    } else {
        data = [];
    }

    dirObject.files = [];

    for (i = 0; i < data.length; i++) {
        item = data[i];
        item.name = nodePath.basename(item.SourceFile);
        item.path = nodePath.resolve(dirObject.path, item.SourceFile);

        dirObject.files.push(item);
    }

    textElement = dirObject.element.firstChild;
    textElement.appendChild(_document.createTextNode(
            " (" + dirObject.files.length + ")"));

    dirObject.files.sort(function(file1, file2) {
        return file1.name.localeCompare(file2.name);
    });

    if (handler) {
        handler(dirObject);
    }
}

/**
 * Searches for directory object.
 *
 * @param {String} fullPath full directory path
 *
 * @returns {Object} directory object or null
 */
function findDirectory(fullPath) {
    var curPath, pathParts, i;

    pathParts = nodePath.relative(rootPath, fullPath).split(nodePath.sep);

    curPath = tree;

    for (i = 0; i < pathParts.length; i++) {
        curPath = findDir(curPath.dirs, pathParts[i]);
    }

    return curPath;
}

/**
 * Searches for directory in the array of directory objects.
 *
 * @param {Array} dirsArray array of directory objects
 * @param {String} dirName name of directory to search for
 *
 * @returns {Object} directory object or null
 */
function findDir(dirsArray, dirName) {
    var i;

    for (i = 0; i < dirsArray.length; i++) {
        if (dirsArray[i].name === dirName) {
            return dirsArray[i];
        }
    }

    return null;
}

/**
 * Searches for file object by full path.
 *
 * @param {String} fullPath full file path
 *
 * @returns {Object} file object or null
 */
function findFile(fullPath) {
    var dirObject = findDirectory(nodePath.dirname(fullPath)),
            fileName = nodePath.basename(fullPath), i, file;

    for (i = 0; i < dirObject.files.length; i++) {
        file = dirObject.files[i];

        if (file.name === fileName) {
            return file;
        }
    }

    return null;
}

/**
 * Displays directory tree in the UI.
 *
 * @param {Element} parent parent element
 * @param {Object} dirObject top directory object
 */
function displayDirectoryTree(parent, dirObject) {
    var li, i, ul;

    li = createDirectoryTreeElement(dirObject);
    parent.appendChild(li);
    dirObject.element = li;

    if (dirObject.dirs.length > 0) {
        ul = _document.createElement("ul");
        li.appendChild(ul);

        for (i = 0; i < dirObject.dirs.length; i++) {
            displayDirectoryTree(ul, dirObject.dirs[i]);
        }
    }
}

/**
 * Creates directory tree element.
 *
 * @param {Object} dirObject directory object
 *
 * @returns {Element} created element
 */
function createDirectoryTreeElement(dirObject) {
    var li, span, text;

    text = dirObject.name;

    if (dirObject.files) {
        text += " (" + dirObject.files.length + ")";
    }

    li = _document.createElement("li");
    span = _document.createElement("span");
    li.appendChild(span);
    span.appendChild(_document.createTextNode(text));
    span.setAttribute("data-path", dirObject.path);
    span.title = dirObject.path;
    span.addEventListener("click", onSelectDirectory, false);

    return li;
}

/**
 * Fired when directory is selected in the directory tree.
 *
 * @param {Event} event the selection event
 */
function onSelectDirectory(event) {
    loadDirectoryFiles(findDirectory(event.target.getAttribute("data-path")));
}

/**
 * Loads the files in the specified directory.
 *
 * @param {Object} dirObject directory object
 */
function loadDirectoryFiles(dirObject) {
    var content, i, file, element, previewElement, span, detailElement,
            ratingElement, rating, j, ratingContainer;

    if (selectedDirectoryElement) {
        selectedDirectoryElement.classList.remove("selected");
    }

    selectedDirectoryElement = dirObject.element.firstChild;
    selectedDirectoryElement.classList.add("selected");

    detailElement = _document.querySelector("#detail");
    detailElement.innerHTML = "";

    content = _document.querySelector("#content");
    content.innerHTML = "";

    preview.clearQueue();
    clearImageCache();

    for (i = 0; i < dirObject.files.length; i++) {
        file = dirObject.files[i];

        previewElement = _document.createElement("div");
        previewElement.className = "preview";
        span = _document.createElement("span");
        span.appendChild(_document.createTextNode("Loading preview..."));
        previewElement.appendChild(span);

        element = _document.createElement("div");
        element.className = "file-info";
        element.setAttribute("data-path", file.path);
        element.appendChild(previewElement);
        element.appendChild(_document.createTextNode(file.name));
        element.appendChild(_document.createElement("br"));
        element.appendChild(_document.createTextNode("Rating: "));

        rating = file.XMP && typeof file.XMP.Rating === "number"
                ? file.XMP.Rating : null;

        ratingContainer = _document.createElement("div");
        ratingContainer.className = "rating";
        element.appendChild(ratingContainer);

        for (j = 0; j <= 5; j++) {
            ratingElement = _document.createElement("span");
            ratingElement.appendChild(
                    _document.createTextNode(j === 0 ? "✖" : "★"));
            ratingElement.className = j === 0 ? "rating-zero" : "rating-star";

            if (j === 0 && rating === 0 || j > 0 && rating >= j) {
                ratingElement.classList.add("selected");
            }

            ratingElement.addEventListener("click",
                    function(fileObject, rating, ratingContainer) {
                        return function(event) {
                            writeRating(fileObject, rating, ratingContainer);
                        };
                    }(file, j, ratingContainer), false);

            ratingContainer.appendChild(ratingElement);
        }

        content.appendChild(element);

        element.addEventListener("click", onSelectFile, false);

        file.element = element;

        createPreview(file.path, previewElement);
    }
}

/**
 * Writes XMP rating to the file.
 *
 * @param {Object} fileObject file object
 * @param {Number} rating rating value
 * @param {Element} ratingContainer rating container
 */
function writeRating(fileObject, rating, ratingContainer) {
    exiftool.writeTag(fileObject.path, "xmp:rating", rating, function(error, stdout, stderr) {
        exiftool.readFileMetaData(fileObject.path, function(error, stdout, stderr) {
            fileObject.XMP = JSON.parse(stdout)[0].XMP;

            updateRatingDisplay(fileObject, ratingContainer);
        });
    });
}

/**
 * Updates display of rating value for specified file.
 *
 * @param {Object} fileObject file object
 * @param {Element} ratingContainer rating container
 */
function updateRatingDisplay(fileObject, ratingContainer) {
    var childNodes = ratingContainer.childNodes, j,
            rating = fileObject.XMP.Rating;

    if (rating === 0) {
        childNodes[0].classList.add("selected");
        childNodes[1].classList.remove("selected");
        childNodes[2].classList.remove("selected");
        childNodes[3].classList.remove("selected");
        childNodes[4].classList.remove("selected");
        childNodes[5].classList.remove("selected");
    } else {
        childNodes[0].classList.remove("selected");

        for (j = 1; j <= 5; j++) {
            if (rating >= j) {
                childNodes[j].classList.add("selected");
            } else {
                childNodes[j].classList.remove("selected");
            }
        }
    }

    loadFileInfo(fileObject);
}

/**
 * Fired when file info is clicked.
 *
 * @param {Event} event event
 */
function onSelectFile(event) {
    loadFileInfo(findFile(event.currentTarget.getAttribute("data-path")));
}

/**
 * Loads file information.
 *
 * @param {Object} fileObject file object
 */
function loadFileInfo(fileObject) {
    var detailElement = _document.querySelector("#detail");

    if (selectedFileElement) {
        selectedFileElement.classList.remove("selected");
    }

    selectedFileElement = fileObject.element;
    selectedFileElement.classList.add("selected");

    detailElement.innerHTML = "";

    loadMetaData(fileObject);
}

/**
 * Loads metadata into detail pane.
 *
 * @param {Object} fileObject file object
 */
function loadMetaData(fileObject) {
    var detailElement = _document.querySelector("#detail"), propertyName,
            element;

    for (propertyName in fileObject) {
        if (propertyName !== "element"
                && fileObject.hasOwnProperty(propertyName)
                && typeof fileObject[propertyName] === "object") {
            element = _document.createElement("h1");
            element.appendChild(_document.createTextNode(propertyName));
            detailElement.appendChild(element);

            appendMetaDataInfo(fileObject[propertyName]);
        }
    }
}

/**
 * Appends metadata for single group to the detail pane.
 *
 * @param {Object} metadata metadata information
 */
function appendMetaDataInfo(metadata) {
    var detailElement = _document.querySelector("#detail"),
            table = _document.createElement("table"),
            tbody = _document.createElement("tbody"), row, propertyName, cell;

    table.appendChild(tbody);

    for (propertyName in metadata) {
        if (metadata.hasOwnProperty(propertyName)) {
            row = _document.createElement("tr");
            tbody.appendChild(row);

            cell = _document.createElement("td");
            cell.appendChild(_document.createTextNode(propertyName));
            cell.title = propertyName;
            row.appendChild(cell);

            cell = _document.createElement("td");
            cell.appendChild(_document.createTextNode(metadata[propertyName]));
            cell.title = metadata[propertyName];
            row.appendChild(cell);
        }
    }

    detailElement.appendChild(table);
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