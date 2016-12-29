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
				closurePath: 'node_modules/grunt-closure-compiler/',
				js: grunt.file.readJSON("scripts.json"),
				jsOutputFile: 'output/bivrost-min.js',
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
	grunt.loadNpmTasks('grunt-closure-compiler');
	
	// TODO: defines don't want to work
	grunt.registerTask("fix-closure-compiler", function() {
		var minified=grunt.file.read("output/bivrost-min.js");
		minified=minified.replace(/version_build:\s*"[^"]*"/, "version_build:\"+"+new Date().toISOString()+"\"");
		grunt.file.write("output/bivrost-min.js", minified);
	});
	
	// TODO: defines don't want to work
	grunt.registerTask("build-debug", function() {
		var buildver=new Date().toISOString();
		var scripts=grunt.file.readJSON("scripts.json").map(function(fn) {
			return "// ORIGINAL FILE: " + fn + ":\n\n" + grunt.file.read(fn) + "\n";
		}).join("\n\n\n\n").replace(/version_build:\s*"[^"]*"/, "version_build:\""+buildver+"\"");

		grunt.file.write("output/bivrost-debug.js", 
			"// 360WebPlayer DEBUG BUILD "+buildver
		    +"\n// PLEASE DO NOT DISTRIBUTE OR USE IN PRODUCTION"
			+"\n// ----------------------------------------------------\n\n"
			+scripts
			+"\nBivrost.verbose=true; console.log(\"BIVROST 360WebPlayer DEBUG\", Bivrost.version_build, \"PLEASE DO NOT DISTRIBUTE OR USE IN PRODUCTION\");"
		);
        
                
	});

	grunt.registerTask('default', ['sass', 'closure-compiler', 'fix-closure-compiler', 'build-debug']);
	grunt.registerTask('debug', ['sass', 'build-debug']);
	grunt.registerTask('build', ['default']);
};
