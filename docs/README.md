Bivrost.js
==========

Przeglądarka do	filmów i zdjęć panoramicznych i stereoskopowych.


Konfiguracja
------------

Dostępne projekcje obrazu:
- Equirectangular
- Virtual window (zwykłe zdjęcie)
- Już zdeformowane

Dostępne źródła obrazu:
- webm/inne filmowe (webm preferowane)
- jpeg/png

Dostępne tilowanie źródeł - dodać parametr crop={vert deg}x{horiz deg}; tylko przy equirectangular
- pełne 360x180 (ratio 2:1)
- częściowe (scropowane) (ratio wyliczane)

Dostępne źródła stereoskopii
- brak stereoskopii
- dwa osobne obrazy (nie dla filmów)
- side-by-side
- top-bottom
- już zdeformowane
https://opticalflow.wordpress.com/2010/09/19/side-by-side-versus-top-and-bottom-3d-formats/

Dostępne prezentacje
- ekran normalny (ramka)
- oculus/cardboard (czy to się różni?)


Wymagania co do materiałów
--------------------------

Macbook, firefox nightly, tekstura downscalowana do 4k.

Macbook, firefox nightly, tekstura narzeka, że nie jest POT (ale sam naprawia).

vr.chromeexperiments.com, niedźwiedzie (mono):

> Stream #0:0(und): Video: h264 (Main) (avc1 / 0x31637661), yuv420p, 
> 1920x960 [SAR 1:1 DAR 2:1], 3352 kb/s, 24.01 fps, 25 tbr, 90k tbn, 50 tbc (default)


Przerabianie materiałów, OSX
----------------------------

Do web przyjęty format filmów to:
- stereo 2048x2048, framerate ok 25-30 fps, bitrate 2M
- mono 2048x1024, framerate ok 25-30 fps, bitrate 1M

> ffmpeg -i in.mp4 -vf scale=2048:2048 -r 30 -c:v libvpx -b:v 1M -strict -2 out.webm

