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

	function handle_h(s_curr_pos) {
		var open_tag = 0;
		var close_tag = 0;

		// header starting tag
		while(hasnext()) {
			if (peek() === "=") {
				open_tag++;
				next();
			} else {
				break;
			}
		}

		if (open_tag < 1 || open_tag > 6) {
			return;
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

		if (close_tag < 1) {
			return;
		}

		// skip empty lines after header
		var e_curr_pos = g_curr_pos; // end position of the text
		var newline = handle_newline();

		if (newline < 1) {
			return;
		}

		var level = Math.min(open_tag, close_tag);
		handle_t(s_curr_pos);
		add_token(["h", level, str.substring(g_last_pos + level, e_curr_pos - level) ], g_curr_pos);
	}

	function handle_p(s_curr_pos) {
		var newline = handle_newline();

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
	}

	while(hasnext()) {
		switch(peek()) {
			case "=":
				handle_h(g_curr_pos);
				break;
			case "\r":
			case "\n":
				handle_p(g_curr_pos);
				break;
			default:
				next();
				break;
		}
	}
	handle_t(g_curr_pos);
};

$.mediawiki.format = function (text) {
	var g_token = null; // current global context, paragraph
	var g_result = [];

	function open_p(s_token) {
		if (!g_token) { // automatically wrap text with paragraph context if it doesn't exists yet
			g_result.push("<p>");
			g_token = ["p"];
		}
	}

	function close_p(s_token) {
		if (g_token) {
			g_result.push("</p>");
			g_token = null;
		}
	}

	function handle_t(s_token) {
		open_p();
		g_result.push(s_token[1]);
	}

	function handle_b(s_token) {
		open_p();
		g_result.push("<br>");
	}

	function handle_h(s_token) {
		close_p();
		g_result.push(["<h",s_token[1],">",$.trim(s_token[2]),"</h",s_token[1],">"].join(""));
	}

	$.mediawiki.tokenize(text, function(token) {
		switch (token[0]) {
			case "p":
				close_p(token);
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
			default:
				throw new Error("invalid token");
		}
	});
	close_p(null);

	return g_result.join("");
};

}(jQuery));
