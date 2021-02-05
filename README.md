## Eth Gas Fee Tracker

Forked from afmsavage/gasbot

Discrod bot that publishes Eth gas price and alert when price is below custom threeshold value.

Data get from [Gasnow](https://gasnow.org) and [Etherscan](https://etherscan.io/gastracker#historicaldata)

### Usage

* Create a .env file in the root directory with your Discord bot token
* Either create a Docker image using `docker build .` or start the bot with `npm run start`
* Change the groupeID if you want to ping specific role : <@&GroupeID>
* On your server that you invited the bot to, type `!gas` in a channel and it will return the prices
* Type !setThreeshold VALUE to set the threeshold value (60 Gwei by default)
* Type !alert to on/off alert

Alert is disable for 5 min after trigger, unless price rise up again.