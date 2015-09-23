module.exports = function (grunt) {
	var mustache;
	
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
		},
		
		"mustache_render": {
			options: {
				directory: "demo-source"
			},
			examples: {
				files: (function() {
					var r=[];
					grunt.file.readJSON("demo-source/examples.json").forEach(function(data, i) {
						if(data["override-scripts"])
							data.scripts=grunt.file.readJSON("scripts.json");
						r.push({
							template: "demo-source/tag-template.mustache",
							dest: "demo/"+data.slug+".html",
							data: data
						});
//						r.push({
//							template: "demo-source/data-template.mustache",
//							dest: "demo/"+data.slug+"-data.html",
//							data: data
//						});
					});
					return r;
				})()
			},
			index: {
				files: [
					{
						template: "demo-source/index.mustache",
						dest: "demo/index.html",
						data: {
							examples: grunt.file.readJSON("demo-source/examples.json"),
							title: "documentation index"
						}
					}
				]
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-sass');
//	grunt.loadNpmTasks('grunt-postcss');
	grunt.loadNpmTasks('grunt-closure-compiler');
	grunt.loadNpmTasks('grunt-mustache-render');

	grunt.registerTask('default', ['sass', 'closure-compiler', "mustache_render"]);
	grunt.registerTask('build', ['sass', 'closure-compiler', "mustache_render"]);
};

// scss -> css
// js | concat | closure -> js