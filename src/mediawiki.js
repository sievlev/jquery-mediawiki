/// FIXME replace while(hasnext) with do-while(hasnext) ?

(function($) {
"use strict";

var lib = $.mediawiki = $.mediawiki || {};

lib.tokenize = function tokenize(str, callback) {
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
		var ch;
		// always eat control symbols to avoid second call of handler
		while(hasnext()) {
			ch = peek();
			if (ch === '#' || ch === '*') {
				next();
			} else {
				break;
			}
		}
		var l_curr_pos = g_curr_pos; // end position of the markers

		// no at start of the line
		if (!newline) {
			return 0;
		}

		while(hasnext()) {
			ch = peek();
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
			add_token([str.substring(g_last_pos, l_curr_pos), str.substring(l_curr_pos, e_curr_pos) ], g_curr_pos);
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

lib.autocorrect = function(callback) {
	var g_stack = lib.utils.linkedlist(); // stack of disbalanced items
	var g_tokens = lib.utils.linkedlist(); // head of list of unprocessing items
	var g_context = null; // current global context

	function dump_tokens() {
		// automatically drop last unclosed tokens
		// automatically close other unclosed tokens
		while(g_stack.length) {
			var last = g_stack.pop();
			if (g_tokens.is_last(last)) {
				g_tokens.pop();
			} else {
				var l_tag = last.data[1];
				if (l_tag === 5) {
					last.data = ["'", 3];
					g_tokens.push(["'", 2], last);
					g_tokens.push(["'", 2]);
					g_tokens.push(["'", 3]);
				} else {
					g_tokens.push(["'", l_tag]);
				}
			}
		}

		g_tokens.foreach(callback);
		g_tokens = lib.utils.linkedlist();
	}

	function handle_emphasize(token) {
		if (!g_stack.length) { // no unbalanced items
			dump_tokens();
			g_stack.push(g_tokens.push(token));
			return;
		}

		var curr_tag = token[1];
		var prev = g_stack.peek(); // last unbalanced item
		var prev_tag = prev.data[1];

		if (prev_tag === curr_tag) {
			if (prev_tag === 5) {
				prev.data = ["'", 3];
				g_tokens.push(["'", 2], prev);
				g_tokens.push(["'", 2]);
				g_tokens.push(["'", 3]);
			} else {
				g_tokens.push(token);
			}
			g_stack.pop();
		} else {
			if (prev_tag === 5) {
				prev.data = ["'", 5 - curr_tag];
				g_tokens.push(["'", curr_tag], prev);
				g_tokens.push(["'", curr_tag]);
			} else if (curr_tag === 5) {
				g_tokens.push(["'", prev_tag]);
				g_stack.pop();
				var new_tag = 5 - prev_tag;
				var new_curr = g_tokens.push(["'", new_tag]);
				if (!g_stack.length || g_stack.peek().data[1] !== new_tag) {
					g_stack.push(new_curr);
				} else {
					g_stack.pop();
				}
			} else if (g_stack.length === 1) {
				g_stack.push(g_tokens.push(token));
			} else {
				g_tokens.push(["'", prev_tag]);
				g_stack.pop();
				g_tokens.push(token);
				g_stack.pop();
				g_stack.push(g_tokens.push(["'", prev_tag]));
			}
		}
	}

	return function(token) {
		if (token == null) {
			dump_tokens();
			return;
		}
		var token_type = token[0][0];
		switch(token_type) {
			// block tokens
			case "h":
			case "p":
			case "*":
			case "#":
				dump_tokens();
				if (token_type === "p") {
					g_context = null;
				} else {
					g_context = token;
					callback(g_context);
				}
				break;
			// inline tokens
			case "b":
			case "t":
			case "'":
				if (!g_context || g_context[0] !== "p") {
					g_context = ["p"];
					callback(g_context);
				}
				if (token_type === "'") {
					handle_emphasize(token);
				} else if (g_tokens.length) {
					g_tokens.push(token);
				} else {
					callback(token);
				}
				break;
			default:
				throw new Error("unsupported token");
		}
	};
};

lib.format = function (text) {
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
		open_ctx(["p"]);
	}

	function handle_text(s_token) {
		g_result.push(s_token[1]);
	}

	function handle_br(s_token) {
		g_result.push(new Array(s_token[1] + 1).join("<br>"));
	}

	function handle_heading(s_token) {
		close_ctx(null);
		g_result.push(["<h",s_token[1],">",$.trim(s_token[2]),"</h",s_token[1],">"].join(""));
	}

	function handle_list(s_token) {
		var l_type = s_token[0];
		var l_text = s_token[1];
		var level;

		var ctx = curr_ctx();
		if (ctx[0] === "li") {
			var c_type = ctx[1];
			var common_prefix = 0;
			var common_length = Math.min(c_type.length, l_type.length);

			for(common_prefix = 0; common_prefix < common_length; ++common_prefix) {
				if (c_type[common_prefix] !== l_type[common_prefix]) {
					break;
				}
			}
			for(level=c_type.length; level > common_prefix; --level) {
				close_ctx(2);
			}
			if (l_type.length <= common_prefix) {
				close_ctx(1);
			}
			for(level=common_prefix; level < l_type.length; ++level) {
				open_ctx([(l_type[level] === "*")?"ul":"ol"]);
				open_ctx(["li", l_type]);
			}
			if (l_type.length === common_prefix) {
				open_ctx(["li", l_type]);
			}
		} else {
			close_ctx(null);
			for(level=0; level < l_type.length; ++level) {
				open_ctx([(l_type[level] === "*")?"ul":"ol"]);
				open_ctx(["li", l_type]);
			}
		}

		g_result.push($.trim(l_text));
	}

	function handle_emphasize(s_token) {
		var e_tag;
		switch(s_token[1]) {
			case 2:
				e_tag = "em";
				break;
			case 3:
				e_tag = "strong";
				break;
			default:
				return; // ignore invalid emphasize tags
		}

		if (e_tag === curr_ctx()[0]) {
			close_ctx(1);
		} else {
			open_ctx([e_tag]);
		}
	}

	var corrector = lib.autocorrect(function(token) {
		switch (token[0][0]) {
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
	lib.tokenize(text, corrector);
	corrector(null); // flush buffers
	close_ctx(null); // finally close all active contexts

	return g_result.join("");
};

}(jQuery));
