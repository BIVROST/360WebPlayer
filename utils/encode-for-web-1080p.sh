#!/usr/bin/env bash

mp4_crf="${crf:-23}"
webm_crf="${crf:-10}"
webm_bitrate="${webm_bitrate:-10M}"
bitrate_audio="${bitrate_audio:-128k}"
resolution="${resolution:-1920:1080}"
webm=${webm:-true}
mp4=${mp4:-true}


echo $# $webm $mp4

if [[ $# -lt 2 ]]; then
	echo "SYNTAX: $0 infile outfile_without_extension [additional ffmpeg args]"
	echo "available configuration options:"
	echo "  mp4_crf (default: 23) - lower is higher quality/larger video"
	echo "  webm_crf (default: 10) - lower is higher quality/larger video"
	echo "  webm_bitrate (default: 10M) - higher is higher quality/larger video"
	echo "  bitrate_audio (default: 128k)"
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
	echo "Encoding mp4 (crf: $mp4_crf bitrate a: $bitrate_audio, resolution: $resolution)";
	ffmpeg -i $IN \
		$* \
		-c:v libx264 -preset slow -crf "$mp4_crf" \
		-vf scale=1920:1080 -movflags +faststart -pix_fmt yuv420p  -g 5 \
		-c:a aac -b:a "$bitrate_audio" \
		"$OUT.mp4"
else
	echo "mp4 skipped";
fi


if [[ $webm = "true" ]]; then
	echo "Encoding webm (crf: $webm_crf bitrate a: $bitrate_audio, resolution: $resolution)";
		ffmpeg -i "$IN" \
		$* \
		-codec:v libvpx -b:v "$webm_bitrate" -crf "$webm_crf" \
		-vf scale=$resolution -g 5 \
		-c:a libvorbis -b:a "$bitrate_audio" \
		"$OUT.webm"
else
	echo "webm skipped";
fi
