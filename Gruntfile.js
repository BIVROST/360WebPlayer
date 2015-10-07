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
//					grunt.file.copy("output/bivrost.js", "demo/bivrost.js");
//					grunt.file.copy("output/bivrost.css", "demo/bivrost.css");
					
					var extend=function(proto, ext) {
						var o=Object.create(proto);
						for(var i in ext) 
							if(ext.hasOwnProperty(i))
								o[i]=ext[i];
						return o;
					}
					
					var r=[];
					grunt.file.readJSON("demo-source/examples.json").forEach(function(data, i) {
						data.bivrost_dir="../output/";
						data.minification_visible=true;
						r.push({
							template: "demo-source/tag-template.mustache",
							dest: "demo/"+data.slug+".html",
							data: extend(data, {
								unminified: data.slug+"-unminified.html" 
							})
						});
						r.push({
							template: "demo-source/tag-template.mustache",
							dest: "demo/"+data.slug+"-unminified.html",
							data: extend(data, {
								minified: data.slug+".html",
								scripts: grunt.file.readJSON("scripts.json")
							})
						});
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
							minification_visible: true,
							examples: grunt.file.readJSON("demo-source/examples.json"),
							title: "documentation index"
						}
					}
				]
			}
		},
	});

	grunt.loadNpmTasks('grunt-contrib-sass');
//	grunt.loadNpmTasks('grunt-postcss');
	grunt.loadNpmTasks('grunt-closure-compiler');
	grunt.loadNpmTasks('grunt-mustache-render');

	grunt.registerTask('readme-github-preview', function() {
		var marked=require("marked");
		var markdown=grunt.file.read("README.md");
		var html=marked(markdown);
		grunt.file.write("README.html", html);
	});

	grunt.registerTask('default', ['sass', 'closure-compiler', "mustache_render"]);
	grunt.registerTask('build', ["default"]);
};

// scss -> css
// js | concat | closure -> js