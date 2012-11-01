// self-made linked list still faster then array

(function($) {

var lib = $.mediawiki = $.mediawiki || {};
var module = lib.utils = {};

module.ListIsEmptyError = function() {};

module.DoubleLinkedList = function() {
	this.head = null;
	this.tail = null;
};

module.DoubleLinkedList.prototype.foreach = function(callback, reverse) {
	reverse = reverse || false;
	for(var head=reverse?this.tail:this.head; head; head = reverse?head.prev:head.next) {
		callback(head.data);
	}
};

module.DoubleLinkedList.prototype.peek = function() {
	return this.tail?this.tail.data:null;
};

module.DoubleLinkedList.prototype.pop = function() {
	if (!this.tail) {
		throw new module.ListIsEmptyError();
	}

	var item = this.tail;
	if (this.tail.prev) {
		this.tail = this.tail.prev;
		this.tail.next = null;
	} else {
		this.tail = this.head = null;
	}

	return item.data;
};

module.DoubleLinkedList.prototype.push = function(data, item) {
	item = item || this.tail;
	var item2 = { next: item?item.next:null, prev: item, data: data };
	if (item && item.next) {
		item.next.prev = item2;
	} else {
		this.tail = item2;
	}
	if (!item2.prev) {
		this.head = item2;
	}
	if (item) {
		item.next = item2;
	}

	return item2;
};

module.DoubleLinkedList.prototype.unshift = function(data) {
	var item = { next: this.head, prev: null, data: data };
	if (this.head) {
		this.head.prev = item;
		this.head = item;
	} else {
		this.head = this.tail = item;
	}
};

}(jQuery));