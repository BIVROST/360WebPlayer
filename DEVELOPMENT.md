Development setup
=================

**NOTE:** This are the instructions to build 360WebPlayer from source.
In 99% of the cases, you do not need to do this - all you need is the compiled version that is [available for download at the release tab of the GitHub page][download-link].

[download-link]: https://github.com/Bivrost/360WebPlayer/releases/tag/current

Install npm, ruby and java. Have them in your path.
For Windows we advise to use cygwin.


Prepare the project
-------------------

After a successful git checkout, `cd` into the 360WebPlayer's directory and:

```bash
npm install
npm install -g grunt-cli
gem install sass
gem install compass
mkdir node_modules/grunt-closure-compiler/build
pushd node_modules/grunt-closure-compiler/build
wget https://dl.google.com/closure-compiler/compiler-latest.zip
7z x compiler-latest.zip
mv closure-compiler*jar compiler.jar
rm compiler-latest.zip
popd
```

Note: on some systems, `gem` commands might require administrator privileges:
```bash
sudo gem install sass
sudo gem install compass
```

On recent MacOS, you might need to install `compass` to a different directory if using pre-installed ruby:
```
sudo gem install -n /usr/local/bin compass
```


Build the project
-----------------

Build the project with:

```bash
grunt
```

The results will be stored in the output directory:

* `output/release` - the compiled scripts, styles and html documentation with embedded images
* `output/site` - the HTML, JavaScript and CSS parts that are to be copied to a web server for demonstration. They lack the media files that are supposed to be on the server in the `media` subdirectory. 
* `output/devel` - the HTML, JavaScript and CSS parts that are to be used on a local server for development. They lack the media files that are supposed to be on the server on the prefix dictated by `media_prefix_devel` in the Gruntfile.

There are a few sub targets when you do not want to rebuild everything. The most interesting are:

* `grunt docs` rebuilds the documentation,
* `grunt build` rebuilds and recompiles the JavaScript and CSS files,
* `grunt release` builds the release zip,
* `grunt sass` rebuilds just the CSS,
* `grunt debug` rebuilds the CSS and unminified JavaScript output, without compiling it.




Issue tracking
--------------

The project has two issue trackers, a public one (GitHub) with issues marked as #NNN and a legacy private one (Redmine) with issues marked as redmine-NNN.
