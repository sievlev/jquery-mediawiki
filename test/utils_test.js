/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, throws:false*/
(function($) {
"use strict";

var linkedlist = $.mediawiki.utils.linkedlist;
var ListIsEmptyError = $.mediawiki.utils.ListIsEmptyError;


function linkedlistEqual(lst, expected) {
	var result1 = [];
	lst.foreach(function(data) { result1.push(data); });
	deepEqual(result1, expected);

	var result2 = [];
	lst.reverse_foreach(function(data) { result2.push(data); });
	expected.reverse();
	deepEqual(result2, expected);
}

test("linkedlist, constructor", function() {
	var lst = linkedlist();
	ok(lst.next === lst);
	ok(lst.prev === lst);
	ok(lst.length === 0);
	ok(lst.push !== null);
	ok(lst.pop !== null);
	ok(lst.foreach !== null);
	ok(lst.reverse_foreach !== null);
	ok(lst.unshift !== null);
	ok(lst.peek !== null);
});


test("linkedlist, foreach", function() {
	var lst = linkedlist();

	var item1 = {data: 1, prev: lst};
	lst.next = item1;
	var item2 = {data: 2, prev: item1, next: lst};
	item1.next = item2;

	var result = [];
	lst.foreach(function(data) { result.push(data); });
	deepEqual(result, [1, 2]);
});

test("linkedlist, reverse_foreach", function() {
	var lst = linkedlist();

	var item1 = {data: 1, prev: lst};
	lst.next = item1;
	var item2 = {data: 2, prev: item1, next: lst};
	item1.next = item2;
	lst.prev = item2;

	var result = [];
	lst.reverse_foreach(function(data) { result.push(data); });
	deepEqual(result, [2, 1]);
});

test("linkedlist, peek", function() {
	var lst = linkedlist();

	equal(lst.peek(), null);
	lst.push(1);
	equal(lst.peek(), 1);
	lst.push(2);
	equal(lst.peek(), 2);
});

test("linkedlist, pop", function() {
	var lst = linkedlist();

	throws(function() { lst.pop(); }, ListIsEmptyError);

	lst.push(1);
	lst.push(2);
	linkedlistEqual(lst, [1, 2]);
	equal(lst.length, 2);

	equal(lst.pop(), 2);
	linkedlistEqual(lst, [1]);
	equal(lst.length, 1);

	equal(lst.pop(), 1);
	linkedlistEqual(lst, []);
	equal(lst.length, 0);
});

test("linkedlist, push after specified item", function() {
	var lst = linkedlist();
	equal(lst.length, 0);

	var item = lst.push(1);
	lst.push(3);
	linkedlistEqual(lst, [1, 3]);
	equal(lst.length, 2);

	lst.push(2, item);
	linkedlistEqual(lst, [1, 2, 3]);
	equal(lst.length, 3);
});

test("linkedlist, push after tail", function() {
	var lst = linkedlist();
	equal(lst.length, 0);

	lst.push(1);
	linkedlistEqual(lst, [1]);
	equal(lst.length, 1);

	lst.push(2);
	linkedlistEqual(lst, [1, 2]);
	equal(lst.length, 2);

	lst.push(3);
	linkedlistEqual(lst, [1, 2, 3]);
	equal(lst.length, 3);
});

test("linkedlist, unshift", function() {
	var lst = linkedlist();
	equal(lst.length, 0);

	lst.unshift(1);
	linkedlistEqual(lst, [1]);
	equal(lst.length, 1);

	lst.unshift(2);
	linkedlistEqual(lst, [2, 1]);
	equal(lst.length, 2);
});

test("linkedlist, object independance", function() {
	var lst1 = linkedlist();
	var lst2 = linkedlist();
	ok(lst1 !== lst2);

	lst1.push(1);
	ok(lst1.length === 1);
	ok(lst2.length === 0);
});

test("linkedlist, is last", function() {
	var lst = linkedlist();

	var item1 = lst.push(1);
	ok(lst.is_last(item1) === true);

	lst.push(2);
	ok(lst.is_last(item1) === false);
});

}(jQuery));
