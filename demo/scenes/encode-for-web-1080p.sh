#!/usr/bin/env bash

bitrate_video=10M
bufsize=20M
bitrate_audio=128k
resolution=1920:1080

if [ $# < 2 ]; then
	echo "SYNTAX: $0 infile outfile (mp4 and webm)"
	exit 1
fi

ffmpeg -i "$1" \
	-codec:v libx264 -profile:v high -preset veryfast -b:v $bitrate_video -maxrate $bitrate_video -bufsize $bufsize \
	-vf scale=$resolution -movflags +faststart -pix_fmt yuv420p -g 5 \
	-strict experimental -codec:a aac -b:a $bitrate_audio \
	"$2.mp4"

ffmpeg -i "$1" \
	-codec:v libvpx -b:v $bitrate_video -bufsize $bufsize \
	-vf scale=$resolution -g 5 \
	-c:a libvorbis -b:a $bitrate_audio \
	"$2.webm"
