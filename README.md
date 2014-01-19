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

## Status

In development.

## To Do

* watch directories for additions/removals of sub-directories and update the
  tree
* watch directories for file additions/removals and update counts
* on click on directory in directory tree, display list of files in that
  directory (just file name in the first iteration)
* display preview on the files, if tool for generation of the preview is
  available in the system
* when file is clicked, load and display file metadata
* on file double-click display enlarged image preview
* when in enlarged image preview, enable moving forward/backward using buttons
  and keyboard
* enable filtering by meta tag values and strings
* enable editing/addition/removal of meta tags and their values
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