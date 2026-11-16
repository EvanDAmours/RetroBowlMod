CUSTOM ART - drop in your own PNGs, then reload the game. No tools or scripts needed.
(The game must be opened through a web server, e.g. "python3 -m http.server 8000", or your host.
 Opening index.html directly as a file blocks the image swap and you'll see the default art.)

FOLDER                               WHAT IT REPLACES                     SIZE / SHAPE
custom/logos/<ABBR>.png              Team logo everywhere: standings,      Any size. Square is best:
                                     schedule, match screen, midfield,     256x256 recommended (min 64x64).
                                     cutscene badges                       Transparent background.
                                                                           Fitted (not stretched) into a
                                                                           60x60 box inside a 64x64 frame.

custom/trophies/super_bowl.png       Trophy on the Super Bowl stage and    Any size. Portrait 3:4 is best:
                                     the Super Bowl Champions screen       96x128 or 192x256. Transparent.
custom/trophies/afc.png              Trophy in the AFC Champions scene     Same as above.
custom/trophies/nfc.png              Trophy in the NFC Champions scene     Same as above.

custom/field/super_bowl_field.png    Replaces the 4 "RB" marks on the      Any size. Landscape 4:3 is best:
                                     field during the Super Bowl game      192x144 recommended (min 96x72).
                                     and in the Super Bowl cutscene        Transparent background.
                                                                           Fitted into a 96x72 box, which
                                                                           covers about 48x36 field pixels.

Delete a file to go back to the default art. A file that is missing or fails to load is skipped.

TEAM ABBREVIATIONS (file names, upper case):
AFC: BUF MIA NE NYJ  BAL CIN CLE PIT  HOU IND JAX TEN  DEN KC LAC LV
NFC: DAL NYG PHI WAS  CHI DET GB MIN  ATL CAR NO TB  ARI LAR SF SEA
Also accepted: LA (Rams), WSH (Commanders), JAC (Jaguars), OAK (Raiders), SD (Chargers),
and lower-case names like kc.png.

To see the Super Bowl field without reaching the Super Bowl:
Mod Menu > CUTSCENES > "SHOW SUPER BOWL FIELD IN EVERY GAME".
