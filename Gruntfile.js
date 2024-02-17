var player_dir = "";
var docs_source_dir = "docs-generator/";
var output_dir = "output/";
var output_demo = output_dir + "site/";
var output_devel = output_dir + "devel/";
var output_release = output_dir + "release/";
function relative_to_docs(path) { return "../../" + path; }

var media_prefix_devel = "https://docs.bivrost.pro/webplayer-docs/";
var media_prefix = "media/";

module.exports = function (grunt) {
	
	grunt.initConfig({
		
		pkg: grunt.file.readJSON("package.json"),

		"compass": {
			dist: {
				options: {
					config: 'config.rb'
				}
			}
		},
		
		"closure-compiler": {
			frontend: {
				closurePath: 'node_modules/grunt-closure-compiler/',
				js: grunt.file.readJSON("scripts.json"),
				jsOutputFile: output_release + 'bivrost-min.js',
				maxBuffer: 5000,
				options: {
					compilation_level: 'SIMPLE',
					language_in: 'ECMASCRIPT5_STRICT',
					language_out: 'ECMASCRIPT5_STRICT'
				}
			}
		},

		// Documentation builders follow

		"mustache_render": {
			options: {
				directory: docs_source_dir
			},
			examples: {
				files: (function() {
					
					var extend=function(proto, ext) {
						var o=Object.create(proto);
						for(var i in ext) 
							if(ext.hasOwnProperty(i))
								o[i]=ext[i];
						return o;
					};
					
					var r=[];
					grunt.file.readJSON(docs_source_dir + "examples.json").forEach(function(data, i) {
						data.bivrost_dir="";
						data.cachebuster="?cb="+(new Date()).toISOString();
						
						// demo
						//if(!data.devel_only)
						r.push({
							template: docs_source_dir + "tag-template.mustache",
							dest: output_demo + data.slug + ".html",
							data: extend(data, {
								minification_visible: false,
								unminified: data.slug+"-unminified.html"
							})
						});
						r.push({
							template: docs_source_dir + "tag-template.mustache",
							dest: output_demo + data.slug+"-debug.html",
							data: extend(data, {
								minification_visible: false,
								unminified: data.slug+"-debug.html",
								debug: true
							})
						});
						
						// clone data so that adding a prefix won't break it (it's not rendered yet)
						data=JSON.parse(JSON.stringify(data));
						
						if(data.src)
							data.src.forEach(function(source) { 
								// is absolute - use it
								if(source.url.indexOf("://") >= 0)
									return;
								// is in local media - use it with prefix
								else if(grunt.file.exists(media_prefix+source.url))
									source.url="../"+media_prefix+source.url;
								// use from CDN
								else
									source.url=media_prefix_devel+source.url;
							});
						if(data.options)
							data.options.forEach(function(opt) { 
								// not a link, don't change
								if(!opt.is_link)
									return;
								
								// is absolute - use it
								if(opt.value.indexOf("://") >= 0)
									return;
								// is in local media - use it with prefix
								else if(grunt.file.exists(media_prefix+opt.value))
									opt.value="../"+media_prefix+opt.value;
								// use from CDN
								else
									opt.value=media_prefix_devel+opt.value; 
							});
						
						
						// devel
						r.push({
							template: docs_source_dir + "tag-template.mustache",
							dest: output_devel + data.slug+".html",
							data: extend(data, {
								minification_visible: true,
								unminified: data.slug+"-unminified.html",
							})
						});
						
						r.push({
							template: docs_source_dir + "tag-template.mustache",
							dest: output_devel + data.slug+"-unminified.html",
							data: extend(data, {
								minified: data.slug+".html",
								scripts: grunt.file.readJSON(player_dir+"scripts.json").map(function(js) { return relative_to_docs(player_dir+js); } ),
								minification_visible: true,
								styles: [relative_to_docs(output_release + "bivrost.css")],
							})
						});
					});
					return r;
				})()
			},
			index: {
				files: [
					{
						template: docs_source_dir + "index.mustache",
						dest: output_demo + "index.html",
						data: {
							cachebuster: "?cb="+(new Date()).toISOString(),
							minification_visible: false,
							examples: grunt.file.readJSON(docs_source_dir + "examples.json").filter(function(d) { return !d.devel_only; }),
							title: "documentation index"
						}
					},
					{
						template: docs_source_dir + "index.mustache",
						dest: output_demo + "devel.html",
						data: {
							cachebuster: "?cb="+(new Date()).toISOString(),
							minification_visible: true,
							examples: grunt.file.readJSON(docs_source_dir + "examples.json"),
							title: "documentation index DEVEL"
						}
					},
					{
						template: docs_source_dir + "index.mustache",
						dest: output_devel + "index.html",
						data: {
							cachebuster: "?cb="+(new Date()).toISOString(),
							minification_visible: true,
							examples: grunt.file.readJSON(docs_source_dir + "examples.json"),
							title: "documentation index"
						}
					}

				]
			}
		},
		
		"inline": {
			readme: {
				options: {tag: ""},
				src: output_demo + "readme.html",
				dest: output_release + "readme.html" 
			},			
			development: {
				options: {tag: ""},
				src: output_demo + "development.html",
				dest: output_release + "development.html" 
			},
			license_free: {
				options: {tag: ""},
				src: output_demo + "license.html",
				dest: output_release + "license.html" 
			},
			license_commercial: {
				options: {tag: ""},
				src: output_demo + "license-polish.html",
				dest: output_release + "license-polish.html" 
			}
		},
		
		"zip": {
			'using-cwd': {
				cwd: output_release,
				src: [
					output_release + "bivrost.css",
					output_release + "bivrost-min.js",
					output_release + "bivrost-debug.js",
					output_release + "license.html",
					output_release + "license-polish.html",
					output_release + "development.html",
					output_release + "readme.html"
				],
				dest: output_release + "BIVROST360WebPlayer-current.zip"
			}
		},

		"git-describe": {
			"options": { "match": "v[0-9].[0-9]" },
			"target": { }
		},
	});

	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-closure-compiler');
	
	// TODO: defines don't want to work
	grunt.registerTask("fix-closure-compiler", function() {
		var minified=grunt.file.read(output_release + "bivrost-min.js");
		minified=minified.replace(/version_build:\s*"[^"]*"/, "version_build:\"+"+new Date().toISOString()+"\"");
		grunt.file.write(output_release + "bivrost-min.js", minified);
	});
	
	// TODO: defines don't want to work
	grunt.registerTask("build-debug", function() {
		var buildver=new Date().toISOString();
		var scripts=grunt.file.readJSON("scripts.json").map(function(fn) {
			return "// ORIGINAL FILE: " + fn + ":\n\n" + grunt.file.read(fn) + "\n";
		}).join("\n\n\n\n").replace(/version_build:\s*"[^"]*"/, "version_build:\""+buildver+"\"");

		grunt.file.write(output_release + "/bivrost-debug.js", 
			"// 360WebPlayer DEBUG BUILD "+buildver
		    +"\n// PLEASE DO NOT DISTRIBUTE OR USE IN PRODUCTION"
			+"\n// ----------------------------------------------------\n\n"
			+scripts
			+"\nBivrost.verbose=true; console.log(\"BIVROST 360WebPlayer DEBUG\", Bivrost.version_build, \"PLEASE DO NOT DISTRIBUTE OR USE IN PRODUCTION\");"
		);
	});

	/// Documentation generation follows:

	grunt.loadNpmTasks('grunt-mustache-render');
	grunt.loadNpmTasks('grunt-inline');
	grunt.loadNpmTasks('grunt-zip');

	function docsRenderer(fileconv, dest, markedOpts) {
		return function() {
			var Marked=require("marked");
			var Mustache=require("mustache");

			var files=["README.md"];
			for(var i=0; i < files.length; i++) {
				var html = Marked(grunt.file.read(grunt.file.exists(files[i]) ? files[i] : (player_dir+files[i])));
				var innerHTML=(
					html
						.replace(/"([^"]+\.md)"/g, function(t,fn) { 
							if(files.indexOf(fn) === -1) {
								console.log("adding "+fn+" to process queue");
								files.push(fn);
							}
							return fileconv(fn); 
						})
						.replace(/\[ \]/g, "&#9744;")
						.replace(/\[x\]/g, "&#9745;")
						.replace(/<table/g, "<table class=\"table\"")
				);

				var h1tag;
				var h1title;
				innerHTML=innerHTML.replace(/<h1[^>]*>(.+)<[/]h1>/, function(h1tag_, h1title_) {
					h1tag=h1tag_;
					h1title=h1title_;
					return "";
				});

				markedOpts = markedOpts || {};
				markedOpts.title=h1title;
				markedOpts.h1tag=h1tag;
				markedOpts.innerHTML=innerHTML;
				markedOpts.no_head = true;

				var html=Mustache.render(
					grunt.file.read(docs_source_dir + "page-template.mustache"), 
					markedOpts,
					{
						"_head": grunt.file.read(docs_source_dir + "_head.mustache"),
						"_foot": grunt.file.read(docs_source_dir + "_foot.mustache"),
					}
				);
				grunt.file.write(dest+fileconv(files[i]), html);
			}

			grunt.file.expand({cwd:player_dir}, [ "README-*png", "README-*jpeg" ]).forEach(function(fn) {
				grunt.file.copy(player_dir+fn, dest+fn);
			});	
		}
	}

	grunt.registerTask('docs-render', docsRenderer(function(fn) { return fn.replace(/[.]md$/, ".html").toLowerCase(); }, output_demo));

	grunt.registerTask("docs-clean", function() {
		grunt.file.expand({matchBase:true}, [ output_demo + "/*", output_devel + "/*" ])
			.forEach(function(fn) { console.log("remove:",fn); if(0) grunt.file.delete(fn); });
	});
	
	grunt.registerTask("docs-copy-files", function() {
		grunt.file.copy(output_release + "bivrost-min.js", output_demo + "bivrost-min.js");
		grunt.file.copy(output_release + "bivrost-debug.js", output_demo + "bivrost-debug.js");
		grunt.file.copy(output_release + "bivrost.css", output_demo + "bivrost.css");
		grunt.file.copy(output_release + "bivrost-min.js", output_devel + "bivrost-min.js");
		grunt.file.copy(output_release + "bivrost-debug.js", output_devel + "bivrost-debug.js");
		grunt.file.copy(output_release + "bivrost.css", output_devel + "bivrost.css");
	});
	
	grunt.registerTask('release', ['build', 'docs', 'inline', 'zip', "zip-rename"]);
	grunt.registerTask('docs', ['docs-clean', 'docs-render', 'mustache_render', 'docs-copy-files']);
	grunt.registerTask('build', ['compass', 'closure-compiler', 'fix-closure-compiler', 'build-debug']);
	grunt.registerTask('debug', ['compass', 'build-debug']);
	grunt.registerTask('default', ['build', 'docs', 'release']);

	grunt.loadNpmTasks('grunt-git-describe');

	grunt.registerTask("zip-rename", function() {
		grunt.event.once('git-describe', function (rev) {
			grunt.file.copy(output_release + "BIVROST360WebPlayer-current.zip", output_dir + "BIVROST360WebPlayer-" + rev + ".zip");
		});    
		grunt.task.run('git-describe');
	});
};
