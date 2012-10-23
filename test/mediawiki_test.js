/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
(function($) {

module("MediaWiki tokenize");

function tokenizeEqual(text, expected) {
	var result = [];
	$.mediawiki.tokenize(text, function(token) {
		result.push(token);
	});
	return deepEqual(result, expected);
}

test("base, empty text", function() {
	tokenizeEqual("", []);
});

test("base, text only", function() {
	tokenizeEqual("a", [["t", "a"]]);
});

test("heading, invalid sequences", function() {
	tokenizeEqual("=", [["t", "="]]);
	tokenizeEqual("=a", [["t", "=a"]]);
	tokenizeEqual("a=", [["t", "a="]]);
	tokenizeEqual("=a=", [["t", "=a="]]);
	tokenizeEqual("=a=\r", [["t", "=a=\r"]]);
	tokenizeEqual("=a=\r\r", [["t", "=a=\r\r"]]);
	tokenizeEqual("=a\n", [["t", "=a\n"]]);
	tokenizeEqual("=a\r\n", [["t", "=a\r\n"]]);
	tokenizeEqual("a=\n", [["t", "a=\n"]]);
	tokenizeEqual("a=\r\n", [["t", "a=\r\n"]]);
	tokenizeEqual("========a========\n", [["t", "========a========\n"]]);
	tokenizeEqual("========a========\r\n", [["t", "========a========\r\n"]]);
});

test("heading, correct sequences", function() {
	tokenizeEqual("=a=\n", [["h", 1, "a"]]);
	tokenizeEqual("=a=\r\n", [["h", 1, "a"]]);
	tokenizeEqual("=a=\n\n", [["h", 1, "a"]]);
	tokenizeEqual("=a=\r\n\r\n", [["h", 1, "a"]]);
	tokenizeEqual("==a=\n", [["h", 1, "=a"]]);
	tokenizeEqual("=a==\n", [["h", 1, "a="]]);
	tokenizeEqual("==a==\n", [["h", 2, "a"]]);
	tokenizeEqual("======a======\n", [["h", 6, "a"]]);
	tokenizeEqual("=a=\nt", [["h", 1, "a"], ["t", "t"]]);
	tokenizeEqual("t\n=a=\n", [["t", "t\n"], ["h", 1, "a"]]);
});

test("paragraph, invalid sequences", function() {
	tokenizeEqual("\n", [["t", "\n"]]);
	tokenizeEqual("\r", [["t", "\r"]]);
	tokenizeEqual("\r\n", [["t", "\r\n"]]);
	tokenizeEqual("\r\r", [["t", "\r\r"]]);
});


test("paragraph, short sequences", function() {
	tokenizeEqual("\n\n", [["p"]]);
	tokenizeEqual("a\n\n", [["t", "a"], ["p"]]);
	tokenizeEqual("\n\na", [["p"], ["t", "a"]]);
	tokenizeEqual("\na\n", [["t", "\na\n"]]);

	tokenizeEqual("\n\r\n", [["p"]]);
	tokenizeEqual("\r\n\n", [["p"]]);
	tokenizeEqual("\r\n\r\n", [["p"]]);
	tokenizeEqual("a\r\n\r\n", [["t", "a"], ["p"]]);
	tokenizeEqual("\ra\n\r\n", [["t", "\ra"], ["p"]]);
	tokenizeEqual("\r\na\r\n", [["t", "\r\na\r\n"]]);
	tokenizeEqual("\r\n\ra\n", [["t", "\r\n\ra\n"]]);
	tokenizeEqual("\r\n\r\na", [["p"], ["t", "a"]]);
});

test("paragraph, long sequences", function() {
	// long sequences
	tokenizeEqual("\n\n\n", [["p"], ["b"]]);
	tokenizeEqual("\n\n\n\n", [["p"], ["b"], ["p"]]);
});

module("MediaWiki format");

function formatEqual(text, expected) {
	return strictEqual($.mediawiki.format(text), expected);
}

test("heading", function() {
	formatEqual("==heading==\n","<h2>heading</h2>");
	formatEqual("== heading ==\n","<h2>heading</h2>");
});

test("paragraph", function() {
	formatEqual("aaa", "<p>aaa</p>");
	formatEqual("aaa\nbbb", "<p>aaa\nbbb</p>");
	formatEqual("aaa\n\nbbb", "<p>aaa</p><p>bbb</p>");
	formatEqual("aaa\n\n\nbbb", "<p>aaa</p><p><br>bbb</p>");
	formatEqual("aaa\n\n\n\nbbb", "<p>aaa</p><p><br></p><p>bbb</p>");
	formatEqual("aaa\n\n\n\n\nbbb", "<p>aaa</p><p><br></p><p><br>bbb</p>");
});

test("paragraph and heading", function() {
	formatEqual("message\n==heading==\n", "<p>message\n</p><h2>heading</h2>");
	formatEqual("message\r==heading==\n", "<p>message\r</p><h2>heading</h2>");
	formatEqual("message\n\n==heading==\n", "<p>message</p><h2>heading</h2>");
	formatEqual("message\n\n\n==heading==\n", "<p>message</p><p><br></p><h2>heading</h2>");
	formatEqual("message\n\n\n\n==heading==\n", "<p>message</p><p><br></p><h2>heading</h2>");
});

test("heading and paragraph", function() {
	formatEqual("==heading==\nmessage", "<h2>heading</h2><p>message</p>");
	formatEqual("==heading==\r\nmessage", "<h2>heading</h2><p>message</p>");
	formatEqual("==heading==\n\nmessage", "<h2>heading</h2><p>message</p>");
	formatEqual("==heading==\r\n\r\nmessage", "<h2>heading</h2><p>message</p>");
});

}(jQuery));
