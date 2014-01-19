/**
 * Copyright 2014 Miroslav Šulc
 */

//var gui = require('nw.gui');

onload = function() {
    var kitty = require("./js/kitty.js");
    kitty.init(document);
}