Development setup
=================

Install npm, ruby and java. Have them in your path.
For windows it's easiest to use cygwin.


Prepare the project
-------------------

cd $webplayer_directory
npm install
npm install -g grunt-cli
gem install sass
gem install compass
mkdir node_modules/grunt-closure-compiler/build
pushd node_modules/grunt-closure-compiler/build
wget https://dl.google.com/closure-compiler/compiler-latest.zip
7z x compiler-latest.zip
rm compiler-latest.zip
popd


Build the project
-----------------

grunt