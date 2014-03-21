# Kitty

Kitty is file metadata viewer, editor and organizer. It works over selected
directory and its subdirectories. It does not use any database for storing of
metadata, metadata are stored directly in the files or their associated files.
Only supported files are displayed, unsupported files are filtered out.

## Supported Platforms

Kitty is implemented using
[node-webkit](https://github.com/rogerwang/node-webkit) so it should run on all
platforms where node-webkit runs, which are at this moment Linux, Windows and
Mac.

## Required External Tools

* [node-webkit](https://github.com/rogerwang/node-webkit) (mandatory)
* [ExifTool](http://www.sno.phy.queensu.ca/~phil/exiftool/) by Phil Harvey
  (mandatory - used for metadata reading/writing)
* [ImageMagick](http://www.imagemagick.org/) (optional - used for generating of
  previews of various files)
* [UFRaw](http://ufraw.sourceforge.net/) (optional - used for generating of
  previews of image RAW files)
* [dcraw](http://www.cybercom.net/~dcoffin/dcraw/) (optional - used for
  generating of preview of image RAW files)

## Status

In development.

## To Do

* implement session cache for previews (checking by file date and size, sorting
  using full directory path hashes)
* watch directories for additions/removals of sub-directories and update the
  tree
* watch directories for file additions/removals and update counts and metadata
* on preview double-click display enlarged preview
* when in enlarged preview, enable moving forward/backward using buttons and
  keyboard
* enable filtering by meta tag values, strings and media types
  (audio/video/image/...)
* enable editing/addition/removal of meta tags and their values on single files
* enable editing/addition/removal of meta tags and their values on multiple
  files at once
* enable easy rating of images (rating and image rejection) usable for
  photography
* add translations

## Running the application

The application is implemented using [node-webkit](https://github.com/rogerwang/node-webkit)
so it needs to be installed on your system. You can download it
[here](https://github.com/rogerwang/node-webkit/blob/master/README.md#downloads).
To run the application, run:


````bash
$ ./nw dir
````

where dir is directory where index.html of the application is located.