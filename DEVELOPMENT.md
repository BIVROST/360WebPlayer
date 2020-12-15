Development setup
=================

**NOTE:** These are the instructions for developing 360WebPlayer. For information on how to use the player, please refer to the main documentation.  
The compiled version [available for download at the release tab of the GitHub page][download-link] is sufficient in 99% of the cases – building the player by yourself is not necessary.

[download-link]: https://github.com/BIVROST/360WebPlayer/releases

Install npm, ruby and java. Have them in your path.
For Windows we advise to use cygwin.


Development requirements
------------------------

To successfully build the project, the following tools are required:

1. *npm* (for build process)
2. *ruby* (for compass and sass)
3. *java* (for running closure compiler)
4. *7zip* (for installing closure compiler)

These tools are then used to prepare the environment, install dependencies and build the project.

If you have all four of these, proceed to the next section.

### Tips:

On WSL/ubuntu, `ruby-dev` is required for sass installation.
```
sudo apt-get install ruby-dev
```

Java JRE is required for Google Closure Compiler:
```
sudo apt install openjdk-8-jre-headless
```

Prepare the project
-------------------

After a successful git checkout, `cd` into the 360WebPlayer's directory and:

```bash
npm install
gem install sass
npm install -g grunt-cli
gem install compass
mkdir -p node_modules/grunt-closure-compiler/build
pushd node_modules/grunt-closure-compiler/build
wget https://dl.google.com/closure-compiler/compiler-20200719.zip
7z x -aos compiler-20200719.zip
mv closure-compiler-v20200719.jar compiler.jar
rm compiler-20200719.zip
popd
```

### Tips:

Note: on some systems, `gem` and `npm install -g` commands might require administrator privileges:
```bash
sudo gem install sass
sudo gem install compass
sudo npm install -g grunt-cli
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
