jquery-mediawiki
================

Simple formatter for documents in MediaWiki format.

This is a simple transformer of input sequence to html text
without intermediate DOM tree.
Main goal is to make parser as simple as possible.

Supported:
 * heading
 * paragraph
 * ordered and unordered lists, including nested lists
 * emphasize

TODO:
 * drop '\n' symbols at the start of document
 * automatic 'p' insertion in autocorrector
 * quote '>' and '&' symbols
 * support comments
 * support hybrid nested lists ( *# ... )
 * links to images
 * support both string buffer and FileReader
 * Ajax sample
 * Drag-n-drop sample

