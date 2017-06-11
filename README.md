# Fuji-san Roulette

![](http://befiveinfo.github.io/images/shared/fujisan-roulette/thumbnail.png)

This game is built upon [Phaser JS](https://phaser.io/) and published under MIT license except for few stock materials used in this game. Please see in the **Special Thanks** section to find out which materials are from third parties.

### How to Play
Choose any number button from 2 ~ 30 to place your bet. Each bet costs 2 credits. Press START button to spin the roulette. You win if the roulette stops at any of numbers of your choice as indicated by the roulette needle.

100 free credits are replenished every 10 minutes up to a max limit of 200 credits.

### Keys
- 1 ~ 6 numeric keys: Bet.
- Space bar: Start.
- F: toggle full screen.

## Online Demo

Please check up here to see how it works on web. Please be reminded that the demo version is customized with assistant menu and credit replenishment service.

## To try this script on your webserver

1. Make a directory in your web server and copy the content into it.
2. Open http:://yourserver/the_directory_of_your_choice/index.html in your browser
- Note: You can still try the demo by simply double clicking index.html in your computer's desktop. But you will not hear any sound because of CORS issue (please [see here](http://www.html5gamedevs.com/topic/6459-newbie-struggling-with-cors-issues/) for more info).
3. You can easily replace the background art by modifying **images/backgroundArt.jpg** The dimensions of the image should be 600 x 900.
4. There are few configurations that can be modified in the rom-game.js. Edit config/json.
  - **playCost** : defines the amount of credit necessary for 1 bet.
  - **initial_credits** : defines the amount of credit user initially has.
  - **pocketBetStrip** : defines a sequence of pocket numbers.
  - **replenishment_credits** : defines amount of credits to be replenished at a time.
  - **replenishment_max** : defines maximum amount of credits to be replenished.
  - **replenishment_every** : defines time for the next replenishment.

It is possible to enjoy the game by simply downloading the repo as a zip archive, thawing the archive, then opening index.html it by double click. But you do not have web fonts and sound support. You will need to put the archive on your web server for the full functionality.

# Please also see
- Time Square
  - This game is a customized version of Fuji-san Roulette. (Coming Soon)
- [Dealer Ginjirou](http://play.befive.info/dealer-ginjirou/)
  - ![](http://befiveinfo.github.io/images/shared/roulette-experiment/dealer_ginjirou_gamescreen_thumbnail.png)
  - The game uses a single PNG with transparent for the spin wheel discs.

# Special Thanks
 - Kagakuchop Font
   - Distributed at [Getsuren](http://www.getsuren.com/en/). [Twitter account](https://twitter.com/snowy_tgn).
 - The photograph used in the background art, a cityscape of Yokohama with Mount Fuji in the background.
   - Photos taken by [skyseeker](http://www.skyseeker.net/). [Twitter account](https://twitter.com/skyseeker).
 - switch02, button switch sound.
   - [Kurage Kosho](http://www.kurage-kosho.info/) distributes public domain sounds which you can use for absolutely free as long as you do not violate laws by using them.

# License
MIT
