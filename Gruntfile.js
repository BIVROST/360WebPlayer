module.exports = function (grunt) {
	grunt.initConfig({
		
		pkg: grunt.file.readJSON("package.json"),
		
		sass: {
			dist: {
				options: {
					style: 'expanded',
					compass: true,
					sourcemap: "none",
					trace: true
				},
				files: {
					'output/bivrost.css': 'bivrost.scss'
				}
			}
		},
		
		"closure-compiler": {
			frontend: {
				closurePath: './compiler.jar',
				js: grunt.file.readJSON("scripts.json"),
				jsOutputFile: 'output/bivrost.js',
//				maxBuffer: 5000,
				options: {
					compilation_level: 'SIMPLE',
					language_in: 'ECMASCRIPT5_STRICT',
					language_out: 'ECMASCRIPT5_STRICT'
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-sass');
//	grunt.loadNpmTasks('grunt-postcss');
	grunt.loadNpmTasks('grunt-closure-compiler');

	grunt.registerTask('default', ['sass', 'closure-compiler']);
	grunt.registerTask('build', ['sass', 'closure-compiler']);
};

// scss -> css
// js | concat | closure -> js