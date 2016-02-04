var minification_visible=false;
	

	
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
					'output/bivrost.css': 'src/bivrost.scss'
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
					
					var extend=function(proto, ext) {
						var o=Object.create(proto);
						for(var i in ext) 
							if(ext.hasOwnProperty(i))
								o[i]=ext[i];
						return o;
					}
					
					var r=[];
					grunt.file.readJSON("demo-source/examples.json").forEach(function(data, i) {
						data.bivrost_dir="";
						r.push({
							template: "demo-source/tag-template.mustache",
							dest: "demo/"+data.slug+".html",
							data: extend(data, {
								minification_visible: minification_visible,
								unminified: data.slug+"-unminified.html" 
							})
						});
						if(minification_visible)
							r.push({
								template: "demo-source/tag-template.mustache",
								dest: "demo/"+data.slug+"-unminified.html",
								data: extend(data, {
									minified: data.slug+".html",
									scripts: grunt.file.readJSON("scripts.json"),
									minification_visible: minification_visible
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
							minification_visible: minification_visible,
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
		var Marked=require("marked");
		var Mustache=require("mustache");
		
		var files=["README.md"];
		var fileconv=function(fn) { return "github-"+fn.replace(/[.]md$/, ".html").toLowerCase(); }
		for(var i=0; i < files.length; i++) {	
			var html=[
				Mustache.render(grunt.file.read("demo-source/_head.mustache"), { title: "Bivrost 360WebPlayer "+files[i].replace('.md', '') }),
				"\t\n<article>\n",
				Marked(grunt.file.read(files[i]))
					.replace(/"(.+\.md)"/g, function(t,fn) { 
						if(files.indexOf(fn) === -1) {
							console.log("adding "+fn+" to process queue");
							files.push(fn);
						}
						return fileconv(fn); 
					})
					.replace(/\[ \]/g, "&#9744;")
					.replace(/\[x\]/g, "&#9745;")
				,
				"\t\n</article>\n",
				Mustache.render(grunt.file.read("demo-source/_foot.mustache"), { })
			].join("\n\n");
			grunt.file.write("demo/"+fileconv(files[i]), html);
		}
		
		(["README-player.png", "README-skin-autumn.jpeg", "README-skin-default.jpeg", "README-skin-spring.jpeg"]).forEach(function(fn) {
			grunt.file.copy(fn, "demo/"+fn);
		});	
	});

	grunt.registerTask("docs-clean", function() {
		grunt.file.expand({matchBase:true}, [ "demo/*", "!demo/httpd-app.conf" ])
			.forEach(function(fn) { console.log("remove:",fn); grunt.file.delete(fn); });
	});
	
	grunt.registerTask("docs-copy-files", function() {
		grunt.file.expand({matchBase:true}, "demo-source/media/*")
			.forEach(function(fn) { grunt.file.copy(fn, fn.replace(/^demo-source[/]/, "demo/")); });
		grunt.file.copy("output/bivrost.js", "demo/bivrost.js");
		grunt.file.copy("output/bivrost.css", "demo/bivrost.css");
	});

	grunt.registerTask('app', ['sass', 'closure-compiler']);
	grunt.registerTask('docs', ['docs-clean', 'readme-github-preview', 'mustache_render', 'docs-copy-files'])
	
	grunt.registerTask('default', ["app", "docs"]);
	grunt.registerTask('build', ['default']);
};

// scss -> css
// js | concat | closure -> js