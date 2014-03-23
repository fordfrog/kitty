/**
 * Copyright 2014 Miroslav Šulc
 */

var nodeChildProcess = require("child_process"), nodePath = require("path"),
        isAvailable, version, recognizedExtensions = [], isInitialized = false;

nodeChildProcess.exec("exiftool -ver", updateAvailability);

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

        nodeChildProcess.exec("exiftool -listr", updateRecognizedExtensions);
    }
}

/**
 * Parses recognized extensions from the command output.
 *
 * @param {Error} error command error
 * @param {Buffer} stdout command stdout
 * @param {Buffer} stderr command stderr
 */
function updateRecognizedExtensions(error, stdout, stderr) {
    var lines, i, line;

    if (error !== null) {
        return;
    }

    lines = stdout.trim().split("\n");
    recognizedExtensions = [];

    for (i = 1; i < lines.length; i++) {
        line = lines[i].trim();

        if (line) {
            recognizedExtensions =
                    recognizedExtensions.concat(line.split(" "));
        }
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
 * Checks whether file extension is recognized by exiftool.
 *
 * @param {String} file file name
 *
 * @returns {Boolean} true if file is recognized, otherwise false
 */
exports.isFileRecognized = function(file) {
    var ext = nodePath.extname(file).toLocaleUpperCase().substr(1);

    return recognizedExtensions.indexOf(ext) !== -1;
};

/**
 * Reads supported files from specified directory.
 *
 * @param {String} dir directory path
 * @param {Function} handler handler to be called after the directory is read
 */
exports.readDir = function(dir, handler) {
    if (!isAvailable) {
        return;
    }

    nodeChildProcess.exec("exiftool -json -a -g0 .",
            {cwd: dir, maxBuffer: 1024 * 1024 * 100}, handler);
};

/**
 * Writes specified tag to the file.
 *
 * @param {String} file file path
 * @param {String} tag tag
 * @param {Object} value value
 * @param {Function} handler handler
 */
exports.writeTag = function(file, tag, value, handler) {
    if (!isAvailable) {
        return;
    }

    nodeChildProcess.exec("exiftool -overwrite_original -" + tag + "='" + value
            + "' \"" + file + "\"", handler);
};

/**
 * Reads metadata from single file.
 *
 * @param {String} file file path
 * @param {Function} handler handler
 */
exports.readFileMetaData = function(file, handler) {
    if (!isAvailable) {
        return;
    }

    nodeChildProcess.exec("exiftool -json -a -g0 \"" + file + "\"", handler);
};