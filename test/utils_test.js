/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, throws:false*/
(function($) {

var DoubleLinkedList = $.mediawiki.utils.DoubleLinkedList;
var ListIsEmptyError = $.mediawiki.utils.ListIsEmptyError;

function listEqual(lst, expected) {
	var result1 = [];
	lst.foreach(function(data) { result1.push(data); });
	deepEqual(result1, expected);

	var result2 = [];
	lst.foreach(function(data) { result2.push(data); }, true);
	expected.reverse();
	deepEqual(result2, expected);
}

test("DoubleLinkedList, foreach", function() {
	var lst = new DoubleLinkedList();
	lst.push(1);
	lst.push(2);
	lst.push(3);

	var result = [];
	lst.foreach(function(data) { result.push(data); });
	deepEqual(result, [1, 2, 3]);

	result = [];
	lst.foreach(function(data) { result.push(data); }, true);
	deepEqual(result, [3, 2, 1]);
});

test("DoubleLinkedList, peek", function() {
	var lst = new DoubleLinkedList();

	equal(lst.peek(), null);
	lst.push(1);
	equal(lst.peek(), 1);
	lst.push(2);
	equal(lst.peek(), 2);
});

test("DoubleLinkedList, pop", function() {
	var lst = new DoubleLinkedList();

	throws(function() { lst.pop(); }, ListIsEmptyError);

	lst.push(1);
	lst.push(2);
	listEqual(lst, [1, 2]);
	equal(lst.length, 2);

	equal(lst.pop(), 2);
	listEqual(lst, [1]);
	equal(lst.length, 1);

	equal(lst.pop(), 1);
	listEqual(lst, []);
	equal(lst.head, null);
	equal(lst.tail, null);
	equal(lst.length, 0);
});

test("DoubleLinkedList, push after tail", function() {
	var lst = new DoubleLinkedList();
	equal(lst.length, 0);
	equal(lst.head, null);
	equal(lst.tail, null);

	lst.push(1);
	listEqual(lst, [1]);
	equal(lst.length, 1);

	lst.push(2);
	listEqual(lst, [1, 2]);
	equal(lst.length, 2);

	lst.push(3);
	listEqual(lst, [1, 2, 3]);
	equal(lst.length, 3);
});

test("DoubleLinkedList, push after specified item", function() {
	var lst = new DoubleLinkedList();
	equal(lst.length, 0);

	var item = lst.push(1);
	lst.push(3);
	listEqual(lst, [1, 3]);
	equal(lst.length, 2);

	lst.push(2, item);
	listEqual(lst, [1, 2, 3]);
	equal(lst.length, 3);
});

test("DoubleLinkedList, unshift", function() {
	var lst = new DoubleLinkedList();
	equal(lst.length, 0);

	lst.unshift(1);
	listEqual(lst, [1]);
	equal(lst.length, 1);

	lst.unshift(2);
	listEqual(lst, [2, 1]);
	equal(lst.length, 2);
});

}(jQuery));