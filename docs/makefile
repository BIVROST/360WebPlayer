.PHONY: show
show: README.html
		qlmanage -p README.html


README.html: README.md
		asciidoctor -r asciidoctor-diagram README.md 
