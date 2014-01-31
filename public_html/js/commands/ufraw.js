/**
 * Copyright 2014 Miroslav Šulc
 */


var nodeChildProcess = require("child_process"), nodeFs = require("fs"),
        nodePath = require("path"), isAvailable, isInitialized = false;

nodeChildProcess.exec("ufraw-batch --version", updateAvailability);

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
    var useSourceFile;

    if (!isAvailable) {
        return;
    }

    if (nodeFs.exists(sourceFile + ".ufraw")) {
        useSourceFile = sourceFile + ".ufraw";
    } else {
        useSourceFile = sourceFile;
    }

    nodeChildProcess.exec("ufraw-batch --size=" + maxWidth + "x" + maxHeight
            + " --out-type=jpeg --noexif --compression=75 --output=\""
            + targetFile + "\" --overwrite \"" + useSourceFile + "\"",
            callback);
};