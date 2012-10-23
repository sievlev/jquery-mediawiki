module.exports = function(grunt) {

	grunt.initConfig({
		pkg: "<json:package.json>",
		concat: {
			dist: {
				src: "src/*.js",
				dest: "dist/<%= pkg.name %>.js"
			}
		},
		min: {
			dist: {
				src: "<config:concat.dist.dest>",
				dest: "dist/<%= pkg.name %>.min.js"
			}
		},
		qunit: {
			files: ["test/**/*.html"]
		},
		lint: {
			files: ["src/**/*.js", "test/**/*.js"]
		},
		watch: {
			files: "<config:lint.files>",
			tasks: "lint qunit concat min"
		},
		jshint: {
			options: {
				curly: true,
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true,
				browser: true
			},
			globals: {
				jQuery: true
			}
		},
		uglify: {}
	});

	grunt.registerTask("default", "lint qunit concat min");
};
