// Self-made linked list still faster then array
// This code inspired by linked list implementation from Linux kernel

(function($) {
"use strict";

var lib = $.mediawiki = $.mediawiki || {};
var module = lib.utils = {};

// Common utilities

function list_init(head) {
	head.next = head;
	head.prev = head;
	return head;
}

function list_add(prev, next, data) {
	var item = { data: data, next: null, prev: null };
	next.prev = item;
	item.next = next;
	item.prev = prev;
	prev.next = item;

	return item;
}

function list_del(next, prev) {
	next.prev = prev;
	prev.next = next;
}

function list_is_last(item) {
	/*jshint validthis:true */
	return item.next === this;
}

function list_foreach(callback) {
	/*jshint validthis:true */
	for(var pos = this.next; pos !== this; pos = pos.next) {
		callback(pos.data);
	}
}

function list_reverse_foreach(callback) {
	/*jshint validthis:true */
	for(var pos = this.prev; pos !== this; pos = pos.prev) {
		callback(pos.data);
	}
}

function list_push(data, pos) {
	/*jshint validthis:true */
	pos = pos || this.prev;
	var item = list_add(pos, pos.next, data);
	++this.length;
	return item;
}

function list_pop() {
	/*jshint validthis:true */
	if (this.next === this) {
		throw new module.ListIsEmptyError();
	}

	/*jshint validthis:true */
	var item = this.prev;
	list_del(item.next, item.prev);
	--this.length;

	return item.data;
}

function list_peek() {
	/*jshint validthis:true */
	return (this.prev !== this)?this.prev.data:null;
}

function list_unshift(data) {
	/*jshint validthis:true */
	var item = list_add(this, this.next, data);
	++this.length;
	return item;
}

module.ListIsEmptyError = function() {};

module.LinkedList = function() {
	return list_init({
		is_last: list_is_last,
		foreach: list_foreach,
		length: 0,
		push: list_push,
		pop: list_pop,
		peek: list_peek,
		reverse_foreach: list_reverse_foreach,
		unshift: list_unshift
	});
};

}(jQuery));