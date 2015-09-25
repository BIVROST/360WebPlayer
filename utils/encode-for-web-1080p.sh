#!/usr/bin/env bash

bitrate_video="${bitrate_video:-10M}"
bufsize="${bufsize:-20M}"
bitrate_audio="${bitrate_audio:-128k}"
resolution="${resolution:-1920:1080}"
webm=${webm:-true}
mp4=${mp4:-true}


echo $# $webm $mp4

if [[ $# -lt 2 ]]; then
	echo "SYNTAX: $0 infile outfile (mp4 and webm)"
	echo "available configuration options:"
	echo "  bitrate_video (default: 10M)"
	echo "  bitrate_audio (default: 128k)"
	echo "  bufsize (default: 20M)"
	echo "  resolution (default: 1920:1080)"
	echo "  mp4 (default: true)"
	echo "  webm (default: true)"
	exit 1
fi

IN=$1
OUT=$2
shift
shift

if [[ $mp4 = "true" ]]; then
	echo "Encoding mp4 (bitrate v/a: $bitrate_video/$bitrate_audio, bufsize: $bufsize, resolution: $resolution)";
	ffmpeg -i "$IN" \
		$* \
		-codec:v libx264 -profile:v high -vb $bitrate_video -bufsize $bufsize \
		-vf scale=$resolution -movflags +faststart -pix_fmt yuv420p -g 5 \
		-strict experimental -codec:a aac -b:a $bitrate_audio \
		"$OUT.mp4"
else
	echo "mp4 skipped";
fi


if [[ $webm = "true" ]]; then
	echo "Encoding webm (bitrate v/a: $bitrate_video/$bitrate_audio, bufsize: $bufsize, resolution: $resolution)";
	ffmpeg -i "$IN" \
		$* \
		-codec:v libvpx -vb $bitrate_video -bufsize $bufsize \
		-vf scale=$resolution -g 5 \
		-c:a libvorbis -b:a $bitrate_audio \
		"$OUT.webm"
else
        echo "webm skipped";
fi