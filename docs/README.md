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



Moduł `Viewer` - wyświetlanie
-----------------------------

- wykrycie możliwości:
	- fullscreen stereo+vr.js (cardboard/oculus)
	- przeciągana kulka
	- inne?
- rozglądanie się
	- zawsze: przeciągana kulka
	- opcjonalnie: sensor orientacji


Moduł `Picture` - materiał do prezentacji
-----------------------------------------

Konfiguracja:
- source (typ materiału)
	- still (obraz)
	- video (film)
- projection (typ projekcji)
	- equirectangular - zawinięta kula
	- frame - obraz w ramce (nie zawinięty)
- stereoscopy (typ stereoskopii)
	- none - brak
	- top-bottom - prawe oko na górze, lewe na dole
	- top-bottom-reversed - lewe oko na górze, prawe na dole
	- left-right - prawe po prawej, lewe po lewej

API:
- callback onload - jak materiał się wgra
- callback onend - jak materiał się skończy

2. picture - film/obraz, projekcja, typ stereo.
 Wynik: obiekt Picture z onload, cameraCenter, cameraLeft i cameraRight, play, 
pause, length i rewind
3. ui

TODO: wiele uri jednocześnie (cubemapa, dwa osobne pliki na lewy/prawy)