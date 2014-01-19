/**
 * Copyright 2014 Miroslav Šulc
 */

var nodeChildProcess = require("child_process"), nodePath = require("path"),
        isAvailable, isInitialized = false;

nodeChildProcess.exec("identify -version", updateAvailability);

/**
 * Updates command availability status.
 *
 * @param {Error} error command error
 * @param {Buffer} stdout command stdout
 * @param {Buffer} stderr command stderr
 */
function updateAvailability(error, stdout, stderr) {
    isAvailable = error === null;

    if (isAvailable) {
        version = stdout.trim();
    }

    isInitialized = true;
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
 * Checks whether the file is supported by imagemagick. Callback method receives
 * one boolean parameter which is true when file is supported or false if it is
 * not supported.
 *
 * @param {String} file file name
 * @param {Function} callback callback function
 */
exports.isFileSupported = function(file, callback) {
    if (!isAvailable) {
        callback(false);
    }

    nodeChildProcess.exec("identify " + file, function(error, stdout, stderr) {
        callback(error === null);
    });
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
    if (!isAvailable) {
        return;
    }

    nodeChildProcess.exec("convert \"" + sourceFile
            + "\" -quality 75% -auto-orient -thumbnail '" + maxWidth + "x"
            + maxHeight + ">' \"" + targetFile + "\"", callback);
};