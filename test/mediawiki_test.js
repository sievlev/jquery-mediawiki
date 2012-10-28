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
	deepEqual(result, expected);
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
	tokenizeEqual("\n\n\n", [["p"], ["b", 1]]);
	tokenizeEqual("\n\n\n\n", [["p"], ["b", 2]]);
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

test("emphasize, correct sequences", function() {
	tokenizeEqual("a''a", [["t", "a"], ["'", 2], ["t", "a"]]);
	tokenizeEqual("a'''a", [["t", "a"], ["'", 3], ["t", "a"]]);
	tokenizeEqual("a'''''a", [["t", "a"], ["'", 5], ["t", "a"]]);
});

test("emphasize, invalid sequences", function() {
	tokenizeEqual("a'a", [["t", "a'a"]]);
	tokenizeEqual("a''''a", [["t", "a"], ["'", 3], ["t", "'a"]]);
	tokenizeEqual("a''''''a", [["t", "a"], ["'", 5], ["t", "'a"]]);
	tokenizeEqual("a'''''''a", [["t", "a"], ["'", 5], ["t", "''a"]]);
});


module("MediaWiki autocorrect");

function autocorrectEqual(tokens, expected) {
	var result = [];

	var corrector = $.mediawiki.autocorrect(function(token) {
		result.push(token);
	});

	for(var i=0; i<tokens.length; ++i) {
		corrector(tokens[i]);
	}
	corrector(null);
	deepEqual(result, expected);
}

test("autocorrect, basic sequences", function() {
	autocorrectEqual(
		[["t", "a"]], [["t", "a"]]);
	autocorrectEqual(
		[["'", 2]], [["'", 2]]);
	autocorrectEqual(
		[["'", 2], ["p"]], [["'", 2], ["p"]]);
	autocorrectEqual(
		[["'", 2], ["t", "a"], ["'", 2]],
		[["'", 2], ["t", "a"], ["'", 2]]);
	autocorrectEqual(
		[["'", 2], ["'", 3], ["t", "a"], ["'", 3], ["'", 2]],
		[["'", 2], ["'", 3], ["t", "a"], ["'", 3], ["'", 2]])
});

test("autocorrect, incorrect sequences", function() {
	autocorrectEqual(
		[["'", 5], ["t", "a"], ["'", 5]],
		[["'", 3], ["'", 2], ["t", "a"], ["'", 2], ["'", 3]]);
	autocorrectEqual(
		[["'", 5], ["t", "a"], ["'", 3]],
		[["'", 2], ["'", 3], ["t", "a"], ["'", 3]]);
	autocorrectEqual(
		[["'", 3], ["t", "a"], ["'", 5]],
		[["'", 3], ["t", "a"], ["'", 3], ["'", 2]])
	autocorrectEqual(
		[["'", 2], ["t", "a"], ["'", 3], ["t", "b"], ["'", 2]],
		[["'", 2], ["t", "a"], ["'", 3], ["t", "b"], ["'", 3], ["'", 2], ["'", 3]])
	autocorrectEqual(
		[["'", 2], ["t", "a"], ["'", 5], ["t", "b"], ["'", 2]],
		[["'", 2], ["t", "a"], ["'", 2], ["'", 3], ["t", "b"], ["'", 2]])
	autocorrectEqual(
		[["'", 2], ["t", "a"], ["'", 3], ["t", "b"], ["'", 5], ["t", "c"], ["'", 3], ["t", "d"], ["'", 2]],
		[["'", 2], ["t", "a"], ["'", 3], ["t", "b"], ["'", 3], ["'", 2], ["t", "c"], ["'", 3], ["t", "d"], ["'", 2]])
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
	formatEqual("\n\n\n\naaa", "<p><br><br>aaa</p>");
	formatEqual("\n\n\n\n\naaa", "<p><br><br><br>aaa</p>");
	formatEqual("aaa\nbbb", "<p>aaa\nbbb</p>");
	formatEqual("aaa\n\nbbb", "<p>aaa</p><p>bbb</p>");
	formatEqual("aaa\n\n\nbbb", "<p>aaa</p><p><br>bbb</p>");
	formatEqual("aaa\n\n\n\nbbb", "<p>aaa</p><p><br><br>bbb</p>");
	formatEqual("aaa\n\n\n\n\nbbb", "<p>aaa</p><p><br><br><br>bbb</p>");
});

test("paragraph and heading", function() {
	formatEqual("message\n==heading==\n", "<p>message\n</p><h2>heading</h2>");
	formatEqual("message\r==heading==\n", "<p>message\r==heading==\n</p>");
	formatEqual("message\n\n==heading==\n", "<p>message</p><h2>heading</h2>");
	formatEqual("message\n\n\n==heading==\n", "<p>message</p><p><br></p><h2>heading</h2>");
	formatEqual("message\n\n\n\n==heading==\n", "<p>message</p><p><br><br></p><h2>heading</h2>");
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
	formatEqual("*list\n\n\n\n==heading==\n", "<ul><li>list</li></ul><p><br><br></p><h2>heading</h2>");
	formatEqual("*list\n\n\n\n\n==heading==\n", "<ul><li>list</li></ul><p><br><br><br></p><h2>heading</h2>");
});

test("heading and list", function() {
	formatEqual("==heading==\n*list\n", "<h2>heading</h2><ul><li>list</li></ul>");
	formatEqual("==heading==\r\n*list\n", "<h2>heading</h2><ul><li>list</li></ul>");
	formatEqual("==heading==\n\n*list\n", "<h2>heading</h2><ul><li>list</li></ul>");
	formatEqual("==heading==\r\n\r\n*list\n", "<h2>heading</h2><ul><li>list</li></ul>");
});

// TODO: optimize corrector, drop last empty tags
test("emphasize (base)", function() {
	formatEqual("a''italic''a", "<p>a<em>italic</em>a</p>");
	formatEqual("''italic''", "<p><em>italic</em></p>");
	formatEqual("''ita\nc''", "<p><em>ita\nc</em></p>");
	formatEqual("''italic", "<p><em>italic</em></p>");
	formatEqual("normal''", "<p>normal<em></em></p>");

	formatEqual("a'''bold'''a", "<p>a<strong>bold</strong>a</p>");
	formatEqual("'''bold'''", "<p><strong>bold</strong></p>");
	formatEqual("'''b\nd'''", "<p><strong>b\nd</strong></p>");
	formatEqual("'''bold", "<p><strong>bold</strong></p>");
	formatEqual("normal'''", "<p>normal<strong></strong></p>");

	formatEqual("a'''''bold-italic'''''a", "<p>a<strong><em>bold-italic</em></strong>a</p>");
	formatEqual("'''''bold-italic'''''", "<p><strong><em>bold-italic</em></strong></p>");
	formatEqual("'''''bol\nitalic'''''", "<p><strong><em>bol\nitalic</em></strong></p>");
	formatEqual("'''''bold-italic", "<p><strong><em>bold-italic</em></strong></p>");
	formatEqual("normal'''''", "<p>normal<strong><em></em></strong></p>");

	formatEqual("a''b'''c'''b''a", "<p>a<em>b<strong>c</strong>b</em>a</p>");
	formatEqual("a'''b''c''b'''a", "<p>a<strong>b<em>c</em>b</strong>a</p>");
});

// TODO emphasize (autocorrection)
// TODO emphasize and paragraph
// TODO emphasize and heading

}(jQuery));
