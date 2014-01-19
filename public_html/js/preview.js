/**
 * Copyright 2014 Miroslav Šulc
 */

var nodePath = require("path"), nodeOS = require("os"),
        dcraw = require("./commands/dcraw.js"),
        ufraw = require("./commands/ufraw.js"),
        imagemagick = require("./commands/imagemagick.js"),
        numberOfCpus = nodeOS.cpus().length, queue = [], runningThreads = 0;

/**
 * Attemts to create preview using one of the specified handlers.
 *
 * @param {Array} handlers array of preview handlers
 * @param {String} sourceFile source file path
 * @param {String} targetFile target file path
 * @param {Number} maxWidth maximum preview width
 * @param {Number} maxHeight maximum preview height
 * @param {Element} element element where to put the preview
 */
function createPreview(handlers, sourceFile, targetFile, maxWidth, maxHeight,
        element) {
    if (handlers.length === 0) {
        element.firstChild.innerHTML = "";
        element.firstChild.appendChild(element.ownerDocument.createTextNode(
                "No preview"));

        processFinished();

        return;
    }

    handlers[0].createPreview(sourceFile, targetFile, maxWidth, maxHeight,
            function(error, stdout, stderr) {
                if (error) {
                    handlers.splice(0, 1);

                    createPreview(handlers, sourceFile, targetFile, maxWidth,
                            maxHeight, element);
                } else {
                    showPreview(targetFile, element);

                    processFinished();
                }
            });
}

/**
 * Puts path to the preview image to the specified element.
 *
 * @param {String} filePath file path
 * @param {Element} element element where to add img element
 */
function showPreview(filePath, element) {
    var img;

    img = element.ownerDocument.createElement("img");
    img.src = filePath;

    element.innerHTML = "";
    element.appendChild(img);
}

/**
 * Checks queue and the number of running processes and if there are less
 * processes running than there is cpus, new processes are spawn.
 */
function processQueue() {
    var item, targetFile, handlers = [];

    while (queue.length > 0 && runningThreads < numberOfCpus) {
        runningThreads++;

        item = queue.splice(0, 1)[0];

        targetFile = nodePath.resolve(item.tmpDir,
                nodePath.basename(item.filePath) + ".jpg"), handlers = [];

        if (ufraw.isAvailable()) {
            handlers.push(ufraw);
        }

        if (dcraw.isAvailable()) {
            handlers.push(dcraw);
        }

        if (imagemagick.isAvailable()) {
            handlers.push(imagemagick);
        }

        createPreview(handlers, item.filePath, targetFile, item.maxWidth,
                item.maxHeight, item.element);
    }
}

/**
 * Decreases number of running processes and attempts to spawn new process(es).
 */
function processFinished() {
    runningThreads--;

    processQueue();
}

/**
 * Attempts to create preview using one of the available handlers.
 *
 * @param {String} filePath path to the file for which the preview should be
 * created
 * @param {Element} element element where to put the generate preview
 * @param {String} tmpDir path to temporary directory where to create the
 * preview
 * @param {Number} maxWidth maximum width of the preview
 * @param {Number} maxHeight maximum height of the preview
 */
exports.createPreview = function(filePath, element, tmpDir, maxWidth,
        maxHeight) {
    queue.push({
        filePath: filePath,
        element: element,
        tmpDir: tmpDir,
        maxWidth: maxWidth,
        maxHeight: maxHeight
    });

    processQueue();
};
