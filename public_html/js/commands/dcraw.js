/**
 * Copyright 2014 Miroslav Šulc
 */


var nodeChildProcess = require("child_process"), nodePath = require("path"),
        imagemagick = require("./imagemagick.js"), isAvailable,
        isInitialized = false;

nodeChildProcess.exec("dcraw", updateAvailability);

/**
 * Updates command availability status.
 *
 * @param {Error} error command error
 * @param {Buffer} stdout command stdout
 * @param {Buffer} stderr command stderr
 */
function updateAvailability(error, stdout, stderr) {
    isAvailable = error === null || error && error.code === 1 && stdout
            && !stderr;

    if (isAvailable) {
        version = stdout.trim();
    }

    isInitialized = true;
}

/**
 * Checks whether specified file is supported by dcraw.
 *
 * @param {String} filePath file path
 * @param {Function} callback callback function
 */
function isFileSupported(filePath, callback) {
    if (!isAvailable) {
        return;
    }

    nodeChildProcess.exec("dcraw -i \"" + filePath + "\"", callback);
}

/**
 * Resizes the image to the specified size.
 *
 * @param {String} sourceFile source file path
 * @param {String} targetFile target file path
 * @param {Number} maxWidth maximum width of the preview
 * @param {Number} maxHeight maximum height of the preview
 * @param {Function} callback callback function
 */
function resizeImage(sourceFile, targetFile, maxWidth, maxHeight, callback) {
    imagemagick.createPreview(sourceFile, targetFile, maxWidth, maxHeight,
            callback);
}

/**
 * Returns whether the command is available.
 *
 * @returns {Boolean} true if the command is available, false if the command is
 * not available, or undefined if initialization did not finished yet
 */
exports.isAvailable = function() {
    return isAvailable;
};

/**
 * Returns whether the module is initialized.
 *
 * @returns {Boolean} true if the module is initialized, otherwise false
 */
exports.isInitialized = function() {
    return isInitialized;
};

/**
 * Attempts to create preview for the specified file.
 *
 * @param {String} sourceFile source file path
 * @param {String} targetFile target file path
 * @param {Number} maxWidth maximum width of the preview
 * @param {Number} maxHeight maximum height of the preview
 * @param {Function} callback callback function
 */
exports.createPreview = function(sourceFile, targetFile, maxWidth, maxHeight,
        callback) {
    var tmpFile;

    if (!isAvailable || !imagemagick.isAvailable()) {
        return;
    }

    isFileSupported(sourceFile, function(error, stdout, stderr) {
        if (error) {
            callback(error, stdout, stderr);

            return;
        }

        tmpFile = targetFile + ".ppm";

        nodeChildProcess.exec("dcraw -c -w -h -q 0 \"" + sourceFile + "\" > \""
                + tmpFile + "\"", function(error, stdout, stderr) {
                    if (error) {
                        callback(error, stdout, stderr);
                    }

                    resizeImage(tmpFile, targetFile, maxWidth, maxHeight,
                            function(error, stdout, stderr) {
                                callback(error, stdout, stderr);
                            });
                });
    });
};