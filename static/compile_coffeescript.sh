#!/bin/sh
browserify -t coffeeify coffee/app.coffee > js/app.js
