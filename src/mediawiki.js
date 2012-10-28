/// FIXME replace while(hasnext) with do-while(hasnext) ?

(function($) {

$.mediawiki = {};
$.mediawiki.tokenize = function tokenize(str, callback) {
	var g_curr_pos = 0; // current possition in stream
	var g_last_pos = 0; // last position were token was found

	function peek() {
		return str.charAt(g_curr_pos);
	}

	function next() {
		g_curr_pos++;
	}

	function hasnext() {
		return g_curr_pos < str.length;
	}

	function add_token(token, s_curr_pos) {
		callback(token);
		g_last_pos = s_curr_pos;
	}

	function handle_newline() {
		var newline = 0;

		var was_r = false;
		while(hasnext()) {
			var ch = peek();
			if (ch === "\n") {
				next();
				newline++;
				was_r = false;
			} else if (ch === "\r") {
				next(); //always go to the next char to avoid second call of handle_p()
				if (!was_r) {
					was_r = true;
				} else {
					break;
				}
			} else {
				break;
			}
		}

		return newline;
	}

	function handle_text(s_curr_pos) {
		if (g_last_pos !== s_curr_pos) {
			add_token(["t", str.substring(g_last_pos, s_curr_pos)], s_curr_pos);
		}
	}

	function handle_heading(s_curr_pos, newline) {
		var open_tag = 0;
		var close_tag = 0;

		// calculate tag level, always eat control symbols to avoid second call of handler
		while(hasnext()) {
			if (peek() === "=") {
				open_tag++;
				next();
			} else {
				break;
			}
		}

		// invalid tag length or not at start of the line
		if (!newline || open_tag < 1 || open_tag > 6) {
			return 0;
		}

		// header body and ending tag
		while(hasnext()) {
			var ch = peek();
			if (ch === "=") {
				close_tag++;
				next();
			} else if (ch === "\r" || ch === "\n") {
				break;
			} else {
				close_tag = 0;
				next();
			}
		}

		// no close tag
		if (!close_tag) {
			return 0;
		}

		var e_curr_pos = g_curr_pos; // end position of the text

		newline = handle_newline(); // skip empty lines
		if (newline) {
			var level = Math.min(open_tag, close_tag);
			handle_text(s_curr_pos);
			add_token(["h", level, str.substring(g_last_pos + level, e_curr_pos - level) ], g_curr_pos);
		}

		return newline;
	}

	function handle_paragraph(s_curr_pos, newline) {
		// calculate newlines only if it was called after non-newline character
		newline = newline || handle_newline();

		if (newline > 1) {
			handle_text(s_curr_pos);
			add_token(["p"], g_curr_pos);
			if (newline > 2) {
				add_token(["b", newline - 2], g_curr_pos);
			}
		}
		return newline;
	}

	function handle_list(s_curr_pos, newline) {
		var l_type = peek();
		var l_depth = 0;

		// always eat control symbols to avoid second call of handler
		while(hasnext()) {
			if (peek() === l_type) {
				l_depth++;
				next();
			} else {
				break;
			}
		}

		// no at start of the line
		if (!newline) {
			return 0;
		}

		while(hasnext()) {
			var ch = peek();
			if (ch === "\n" || ch === "\r") {
				break;
			} else {
				next();
			}
		}
		var e_curr_pos = g_curr_pos; // end position of the text

		newline = handle_newline(); //skip empty lines
		if (newline) {
			handle_text(s_curr_pos);
			add_token([l_type, l_depth, str.substring(g_last_pos + l_depth, e_curr_pos) ], g_curr_pos);
			handle_paragraph(g_curr_pos, newline);
		}

		return newline;
	}

	function handle_emphasize(s_curr_pos, newline) {
		var e_level = 0;
		while(hasnext()) {
			if (peek() === "'") {
				e_level++;
				next();
			} else {
				break;
			}
		}

		switch(e_level) {
			case 1:
				break;
			case 2:
			case 3:
			case 5:
				handle_text(s_curr_pos);
				add_token(["'", e_level], g_curr_pos);
				break;
			case 4:
				handle_text(s_curr_pos);
				add_token(["'", 3], g_curr_pos-1);
				break;
			default: // > 5
				handle_text(s_curr_pos);
				add_token(["'", 5], g_curr_pos - e_level + 5);
				break;
		}
		return 0;
	}

	function handle_default(s_curr_pos, newline) {
		next();
		return 0;
	}

	var newline = 1;
	while(hasnext()) {
		switch(peek()) {
			case "=":
				newline = handle_heading(g_curr_pos, newline);
				break;
			case "\r":
			case "\n":
				newline = handle_paragraph(g_curr_pos, 0);
				break;
			case "#":
			case "*":
				newline = handle_list(g_curr_pos, newline);
				break;
			case "'":
				newline = handle_emphasize(g_curr_pos, newline);
				break;
			default:
				newline = handle_default(g_curr_pos, newline);
				break;
		}
	}
	handle_text(g_curr_pos);
};

$.mediawiki.autocorrect = function(callback) {
	var stack = []; // stack of disbalanced items
	var head = null; // head of list of unprocessing items
	var tail = null; // tail of list of unprocessing items

	function append_token(token) {
		var item = { token: token, prev: tail, next: null };
		if (head == null) {
			head = item;
		}
		if (tail != null) {
			tail.next = item;
		}
		tail = item;
		return item;
	}

	function dump_tokens() {
		// automatically drop last unclosed tokens
		// automatically close other unclosed tokens
		while(stack.length) {
			var last = stack.pop();
			if (!last.next) {
				tail = last.prev;
				if (tail) {
					tail.next = null;
				} else {
					head = null;
				}
			} else {
				var l_tag = last.token[1];
				if (l_tag === 5) {
					modify_token(last, 3, 2);
					append_token(["'", 2]);
					append_token(["'", 3]);
				} else {
					append_token(["'", l_tag]);
				}
			}
		}

		var item = head;
		while(item) {
			callback(item.token);
			item = item.next;
		}
		head = tail = null;
	}

	function modify_token(item, tag1, tag2) {
		item.token[1] = tag1;
		var item2 = { token: ["'", tag2], prev: item, next: item.next };
		if (item.next) {
			item.next.prev = item2;
		}
		item.next = item2;
		if (item === tail) {
			tail = item2;
		}
	}

	function handle_emphasize(token) {
		if (!stack.length) { // no unbalanced items
			dump_tokens();
			stack.push(append_token(token));
			return;
		}

		var curr_tag = token[1];
		var prev = stack[stack.length - 1]; // last unbalanced item
		var prev_tag = prev.token[1];

		if (prev_tag === curr_tag) {
			if (prev_tag === 5) {
				modify_token(prev, 3, 2);
				append_token(["'", 2]);
				append_token(["'", 3]);
			} else {
				append_token(token);
			}
			stack.pop();
		} else {
			if (prev_tag === 5) {
				modify_token(prev, 5 - curr_tag, curr_tag);
				append_token(["'", curr_tag]);
			} else if (curr_tag === 5) {
				append_token(["'", prev_tag]);
				stack.pop();
				var new_tag = 5 - prev_tag;
				var new_curr = append_token(["'", new_tag]);
				if (!stack.length || stack[stack.length-1].token[1] !== new_tag) {
					stack.push(new_curr);
				} else {
					stack.pop();
				}
			} else if (stack.length === 1) {
				stack.push(append_token(token));
			} else {
				append_token(["'", prev_tag]);
				stack.pop();
				append_token(token);
				stack.pop();
				stack.push(append_token(["'", prev_tag]));
			}
		}
	}

	return function(token) {
		if (token == null) {
			dump_tokens();
			return;
		}
		switch(token[0]) {
			case "h":
			case "p":
			case "*":
			case "#":
				dump_tokens();
				callback(token);
				break;
			case "'":
				handle_emphasize(token);
				break;
			default:
				if (head != null) {
					append_token(token);
				} else {
					callback(token);
				}
				break;
		}
	};
};

$.mediawiki.format = function (text) {
	var g_context = []; // current global context, paragraph, ordered or unordered list,
	var g_result = []; // output

	function close_ctx(depth) {
		while(g_context.length && (depth == null || depth--)) {
			var ctx = g_context.pop();
			g_result.push("</" + ctx[0] + ">");
		}
	}

	function open_ctx(ctx) {
		g_context.push(ctx);
		g_result.push("<" + ctx[0] + ">");
	}

	function curr_ctx() {
		return g_context.length?g_context[g_context.length - 1]:[null];
	}

	function handle_paragraph(s_token) {
		close_ctx(null);
	}

	function handle_text(s_token) {
		var c_tag = curr_ctx()[0];
		if (c_tag !== "p" && c_tag !== "em" && c_tag !== "strong") {
			close_ctx(null);
			open_ctx(["p"]);
		}
		g_result.push(s_token[1]);
	}

	function handle_br(s_token) {
		if (curr_ctx()[0] !== "p") {
			close_ctx(null);
			open_ctx(["p"]);
		}
		g_result.push(new Array(s_token[1] + 1).join("<br>"));
	}

	function handle_heading(s_token) {
		close_ctx(null);
		g_result.push(["<h",s_token[1],">",$.trim(s_token[2]),"</h",s_token[1],">"].join(""));
	}

	function handle_list(s_token) {
		var l_type = s_token[0];
		var l_depth = s_token[1];
		var l_text = s_token[2];

		var block = [(l_type === "*")?"ul":"ol"];

		var ctx = curr_ctx();
		var c_depth;
		if (ctx[0] === "li" && ctx[1] === l_type) {
			c_depth = ctx[2];
			if (c_depth >= l_depth) {
				while(c_depth > l_depth) {
					close_ctx(2);
					c_depth--;
				}
				close_ctx(1);
				open_ctx(["li", l_type, l_depth]);
			} else {
				while(c_depth < l_depth) {
					open_ctx(block);
					open_ctx(["li", l_type, ++c_depth]);
				}
			}
		} else {
			c_depth = 0;
			close_ctx(null);
			do {
				open_ctx(block);
				open_ctx(["li", l_type, ++c_depth]);
			} while(c_depth !== l_depth);
		}

		g_result.push($.trim(l_text));
	}

	function handle_emphasize(s_token) {
		var e_tag;
		var other_tag;
		switch(s_token[1]) {
			case 2:
				e_tag = "em";
				other_tag = "strong";
				break;
			case 3:
				e_tag = "strong";
				other_tag = "em";
				break;
			default:
				return; // ignore invalid emphasize tags
		}

		var c_tag = curr_ctx()[0];
		if (c_tag === e_tag) {
			close_ctx(1);
		} else {
			if (c_tag !== "p" && c_tag !== other_tag) {
				close_ctx(null);
				open_ctx(["p"]);
			}
			open_ctx([e_tag]);
		}
	}

	var corrector = $.mediawiki.autocorrect(function(token) {
		switch (token[0]) {
			case "p":
				handle_paragraph(token);
				break;
			case "t":
				handle_text(token);
				break;
			case "h":
				handle_heading(token);
				break;
			case "b":
				handle_br(token);
				break;
			case "*":
			case "#":
				handle_list(token);
				break;
			case "'":
				handle_emphasize(token);
				break;
			default:
				throw new Error("invalid token");
		}
	});
	$.mediawiki.tokenize(text, corrector);
	corrector(null); // flush buffers
	close_ctx(null); // finally close all active contexts

	return g_result.join("");
};

}(jQuery));
