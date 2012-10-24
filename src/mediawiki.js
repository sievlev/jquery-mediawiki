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

	function handle_t(s_curr_pos) {
		if (g_last_pos !== s_curr_pos) {
			add_token(["t", str.substring(g_last_pos, s_curr_pos)], s_curr_pos);
		}
	}

	function handle_h(s_curr_pos, newline) {
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
			handle_t(s_curr_pos);
			add_token(["h", level, str.substring(g_last_pos + level, e_curr_pos - level) ], g_curr_pos);
		}

		return newline;
	}

	function handle_p(s_curr_pos, newline) {
		// calculate newlines only if it was called after non-newline character
		newline = newline || handle_newline();

		if (newline > 1) {
			handle_t(s_curr_pos);
			for(var i=0;i<newline; ++i) {
				if (i % 2 === 1) {
					add_token(["p"], g_curr_pos);
				} else if (i > 0) {
					add_token(["b"], g_curr_pos);
				}
			}
		}
		return newline;
	}

	function handle_l(s_curr_pos, newline) {
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
			handle_t(s_curr_pos);
			add_token([l_type, l_depth, str.substring(g_last_pos + l_depth, e_curr_pos) ], g_curr_pos);
			handle_p(g_curr_pos, newline);
		}

		return newline;
	}

	function handle_d(s_curr_pos, newline) {
		next();
		return 0;
	}

	var newline = 1;
	while(hasnext()) {
		switch(peek()) {
			case "=":
				newline = handle_h(g_curr_pos, newline);
				break;
			case "\r":
			case "\n":
				newline = handle_p(g_curr_pos, 0);
				break;
			case "#":
			case "*":
				newline = handle_l(g_curr_pos, newline);
				break;
			default:
				newline = handle_d(g_curr_pos, newline);
				break;
		}
	}
	handle_t(g_curr_pos);
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

	function handle_p(s_token) {
		close_ctx(null);
	}

	function handle_t(s_token) {
		if (curr_ctx()[0] !== "p") {
			close_ctx(null);
			open_ctx(["p"]);
		}
		g_result.push(s_token[1]);
	}

	function handle_b(s_token) {
		if (curr_ctx()[0] !== "p") {
			close_ctx(null);
			open_ctx(["p"]);
		}
		g_result.push("<br>");
	}

	function handle_h(s_token) {
		close_ctx(null);
		g_result.push(["<h",s_token[1],">",$.trim(s_token[2]),"</h",s_token[1],">"].join(""));
	}

	function handle_l(s_token) {
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

	$.mediawiki.tokenize(text, function(token) {
		switch (token[0]) {
			case "p":
				handle_p(token);
				break;
			case "t":
				handle_t(token);
				break;
			case "h":
				handle_h(token);
				break;
			case "b":
				handle_b(token);
				break;
			case "*":
			case "#":
				handle_l(token);
				break;
			default:
				throw new Error("invalid token");
		}
	});
	close_ctx(null);

	return g_result.join("");
};

}(jQuery));
