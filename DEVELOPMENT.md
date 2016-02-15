Development setup
=================

Install npm and ruby.

cd $webplayer_directory
npm install
npm install -g grunt-cli
gem install sass
gem install compass
mkdir node_modules/grunt-closure-compiler/build
pushd node_modules/grunt-closure-compiler/build
7z x compiler-latest.zip
rm compiler-latest.zip
popd
grunt