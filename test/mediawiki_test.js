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
	tokenizeEqual("t=a=\n", [["t", "t=a=\n"]]);
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
	tokenizeEqual("\n\n\n", [["p"], ["b"]]);
	tokenizeEqual("\n\n\n\n", [["p"], ["b"], ["p"]]);
});

test("list, wrong sequences", function() {
	tokenizeEqual("a*b\n", [["t", "a*b\n"]]);
	tokenizeEqual("a#b\n", [["t", "a#b\n"]]);
	tokenizeEqual("*b", [["t", "*b"]]);
	tokenizeEqual("*b\r", [["t", "*b\r"]]);
	tokenizeEqual("#b", [["t", "#b"]]);
	tokenizeEqual("#b\r", [["t", "#b\r"]]);
});

test("list, correct sequences", function() {
	tokenizeEqual("*a\n", [["*", 1, "a"]]);
	tokenizeEqual("**a\n", [["*", 2, "a"]]);
	tokenizeEqual("#a\n", [["#", 1, "a"]]);
	tokenizeEqual("##a\n", [["#", 2, "a"]]);
	tokenizeEqual("*a\nt", [["*", 1, "a"], ["t", "t"]]);
	tokenizeEqual("*a\n\nt", [["*", 1, "a"], ["p"], ["t", "t"]]);
	tokenizeEqual("t\n*a\n", [["t", "t\n"], ["*", 1, "a"]]);
	tokenizeEqual("t\n\n*a\n", [["t", "t"], ["p"], ["*", 1, "a"]]);
});

module("MediaWiki format");

function formatEqual(text, expected) {
	return strictEqual($.mediawiki.format(text), expected);
}

test("heading", function() {
	formatEqual("==heading==\n","<h2>heading</h2>");
	formatEqual("== heading ==\n","<h2>heading</h2>");
	formatEqual("\n==heading==\n","<p>\n</p><h2>heading</h2>"); // FIXME?
	formatEqual("\n\n==heading==\n","<h2>heading</h2>");
	formatEqual("\n\n\n==heading==\n","<p><br></p><h2>heading</h2>");
});

test("paragraph", function() {
	formatEqual("aaa", "<p>aaa</p>");
	formatEqual("\naaa", "<p>\naaa</p>");
	formatEqual("\n\naaa", "<p>aaa</p>");
	formatEqual("\n\n\naaa", "<p><br>aaa</p>");
	formatEqual("\n\n\n\naaa", "<p><br></p><p>aaa</p>");
	formatEqual("\n\n\n\naaa", "<p><br></p><p>aaa</p>");
	formatEqual("\n\n\n\n\naaa", "<p><br></p><p><br>aaa</p>");
	formatEqual("aaa\nbbb", "<p>aaa\nbbb</p>");
	formatEqual("aaa\n\nbbb", "<p>aaa</p><p>bbb</p>");
	formatEqual("aaa\n\n\nbbb", "<p>aaa</p><p><br>bbb</p>");
	formatEqual("aaa\n\n\n\nbbb", "<p>aaa</p><p><br></p><p>bbb</p>");
	formatEqual("aaa\n\n\n\n\nbbb", "<p>aaa</p><p><br></p><p><br>bbb</p>");
});

test("paragraph and heading", function() {
	formatEqual("message\n==heading==\n", "<p>message\n</p><h2>heading</h2>");
	formatEqual("message\r==heading==\n", "<p>message\r==heading==\n</p>");
	formatEqual("message1\n\n==heading==\n", "<p>message1</p><h2>heading</h2>");
	formatEqual("message\n\n\n==heading==\n", "<p>message</p><p><br></p><h2>heading</h2>");
	formatEqual("message\n\n\n\n==heading==\n", "<p>message</p><p><br></p><h2>heading</h2>");
});

test("heading and paragraph", function() {
	formatEqual("==heading==\nmessage", "<h2>heading</h2><p>message</p>");
	formatEqual("==heading==\r\nmessage", "<h2>heading</h2><p>message</p>");
	formatEqual("==heading==\n\nmessage", "<h2>heading</h2><p>message</p>");
	formatEqual("==heading==\r\n\r\nmessage", "<h2>heading</h2><p>message</p>");
});

test("list", function() {
	formatEqual("*list\n", "<ul><li>list</li></ul>");
	formatEqual("* list\n", "<ul><li>list</li></ul>");
	formatEqual("*list\n", "<ul><li>list</li></ul>");
	formatEqual("#list\n", "<ol><li>list</li></ol>");
	formatEqual("*list1\n*list2\n", "<ul><li>list1</li><li>list2</li></ul>");
	formatEqual("#list1\n#list2\n", "<ol><li>list1</li><li>list2</li></ol>");
	formatEqual("*list1\n#list2\n", "<ul><li>list1</li></ul><ol><li>list2</li></ol>");
	formatEqual("**list\n", "<ul><li><ul><li>list</li></ul></li></ul>");
	formatEqual("##list\n", "<ol><li><ol><li>list</li></ol></li></ol>");
	formatEqual("*list1\n**list2\n", "<ul><li>list1<ul><li>list2</li></ul></li></ul>");
	formatEqual("*list1\n**list2\n*list3\n", "<ul><li>list1<ul><li>list2</li></ul></li><li>list3</li></ul>");
	formatEqual("*list1\n##list2\n", "<ul><li>list1</li></ul><ol><li><ol><li>list2</li></ol></li></ol>");
});

test("list and paragraph", function() {
	formatEqual("*list\nmessage", "<ul><li>list</li></ul><p>message</p>");
	formatEqual("*list\n\nmessage", "<ul><li>list</li></ul><p>message</p>");
	formatEqual("*list\n\n\nmessage", "<ul><li>list</li></ul><p><br>message</p>");
});

test("paragraph and list", function() {
	formatEqual("message\n*list\n", "<p>message\n</p><ul><li>list</li></ul>");
	formatEqual("message\n\n*list\n", "<p>message</p><ul><li>list</li></ul>");
	formatEqual("message\n\n\n*list\n", "<p>message</p><p><br></p><ul><li>list</li></ul>");
});

test("list and heading", function() {
	formatEqual("*list\n==heading==\n", "<ul><li>list</li></ul><h2>heading</h2>");
	formatEqual("*list\n\n==heading==\n", "<ul><li>list</li></ul><h2>heading</h2>");
	formatEqual("*list\n\n\n==heading==\n", "<ul><li>list</li></ul><p><br></p><h2>heading</h2>");
	formatEqual("*list\n\n\n\n==heading==\n", "<ul><li>list</li></ul><p><br></p><h2>heading</h2>");
	formatEqual("*list\n\n\n\n\n==heading==\n", "<ul><li>list</li></ul><p><br></p><p><br></p><h2>heading</h2>");
});

test("heading and list", function() {
	formatEqual("==heading==\n*list\n", "<h2>heading</h2><ul><li>list</li></ul>");
	formatEqual("==heading==\r\n*list\n", "<h2>heading</h2><ul><li>list</li></ul>");
	formatEqual("==heading==\n\n*list\n", "<h2>heading</h2><ul><li>list</li></ul>");
	formatEqual("==heading==\r\n\r\n*list\n", "<h2>heading</h2><ul><li>list</li></ul>");
});

}(jQuery));
