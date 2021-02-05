const fs = require('fs');
require('dotenv').config();

const Discord = require('discord.js'); // https://discord.js.org/
const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));

const prefix = '!';
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}


const axios = require('axios').default;
const urlGasNow = 'https://www.gasnow.org/api/v3/gas/price';
const urlEtherscan = 'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken';
const web3utils = require('web3-utils');
var schedule = require('node-schedule');
// ----------------
// ----------------
// SCHEDULED EVENTS
// ----------------
// ----------------

const ALERT_FREQUENCY = "30 * * * * *"   // default every 30 sec

var gas_alert = "off"
var alertThreeshold = 60;
var channel;
var timeBetweenAlertSec = 300;
var time = 0;
var alertTrigger = false;
var currentGasNow = [];
var currentGasEtherScan = [];

function getGasFee() {
  return new Promise((resolve, reject) => {
    axios.all([axios.get(urlGasNow), axios.get(urlEtherscan)]).then(
      axios.spread((responeGasNow, responseEtherScan) => {
        console.log(responeGasNow);
        const gasPriceGasNow = responeGasNow.data.data;
        let BN = web3utils.BN;
        currentGasNow = [
          web3utils.fromWei(new BN(gasPriceGasNow.rapid).toString(), "gwei"),
          web3utils.fromWei(new BN(gasPriceGasNow.fast).toString(), "gwei"),
          web3utils.fromWei(new BN(gasPriceGasNow.standard).toString(), "gwei"),
          web3utils.fromWei(new BN(gasPriceGasNow.slow).toString(), "gwei")
        ];
        //});
 
        const gasPriceEtherScan = responseEtherScan.data.result;
        currentGasEtherScan = [
          gasPriceEtherScan.FastGasPrice,
          gasPriceEtherScan.ProposeGasPrice,
          gasPriceEtherScan.SafeGasPrice
        ];
        console.log(currentGasNow, currentGasEtherScan);
        resolve();
      })
    );
 
  });
}
 

function sentGasMessage()
{
	console.log("Send Gas Message");
	channel.send("GasNow\n" + 
					"```rapid: " + currentGasNow[0] +
					"\nfast: " + currentGasNow[1] +
					"\nstandard: " + currentGasNow[2] +
					"\nslow: " + currentGasNow[3] + "```");
	channel.send("EtherScan\n" + 
					"```Fast: " + currentGasEtherScan[0] +
					"\nAverage: " + currentGasEtherScan[1] +
					"\nSlow: " + currentGasEtherScan[2] + "```");
}

function getcurrentGas()
{
	getGasFee().then(() => { sentGasMessage();});
}

function setThreeshold(threeshold)
{
	alertThreeshold = threeshold;
	console.log("Threeshold set to " + alertThreeshold + "Gwei");
}

// Gas scheduled alert system
var gasAlertSystem = schedule.scheduleJob(ALERT_FREQUENCY, function(){
  if (gas_alert === "on") {
	console.log("Running scheduled gas analysis..")
	time += 30;
	console.log("Can trigger " +  !alertTrigger);
	if(alertTrigger && time >= timeBetweenAlertSec)
	{
		time = 0;
		alertTrigger = false;
		channel.send("Alert can trigger again\n");
	}

	  getGasFee().then(() => { 
	  var currentStandardGasNow = currentGasNow[2];
	  var currentStandardEtherScan = currentGasEtherScan[1]
		console.log("CurrentStandardGasNow = " + currentStandardGasNow);
		console.log("currentStandardEtherScan = " + currentStandardEtherScan);
		console.log("alertThreeshold = " + alertThreeshold);
	  if(alertTrigger === false && (currentStandardGasNow <= alertThreeshold ||  currentStandardEtherScan <= alertThreeshold))
	  {
		alertTrigger = true;
		time = 0;
		console.log("Threeshold trigger");
		channel.send("<@&807255661683015741>\n");
		sentGasMessage();
		channel.send("Alert disable for 5min\n");
	  } else if (alertTrigger && (currentStandardGasNow > alertThreeshold || currentStandardEtherScan > alertThreeshold))
	  {
	    console.log("Threeshold trigger");
		channel.send("<@&807255661683015741> Gas fee above Threeshold\n");
		sentGasMessage();
	  }
	  });  
  }
});

client.once('ready', () => {
  // sets bot presence
  client.user.setActivity('ethgasbot', {
    game: {
      name: 'eth gas bot',
      type: 'Watching',
      urlGasNow: 'https://www.gasnow.org/',
    },
  });
  console.log(`Logged in as ${client.user.tag}!`);
  //getGasFee();
});

// actions that launch upon any messages in the channel
client.on('message', message => {
	channel = message.channel;
	var messageStr = message.content;
	var channelID = message.channel;
    // filters only for commands that start with '!'
    if (messageStr.substring(0, 1) == '!') {
        var args = messageStr.substring(1).split(' ');
        var command = args[0]
        var param = args[1]
        var param2 = args[2]
        if (param != undefined ) {
          param = param.toUpperCase()
        }

        // help command
        if (command == "help") {
          channel.send("This is ETH Gas fee tracker! Here's a list of commands. \n" +
            "!gas : gives you the current gas price in Gwei\n" +
            "!setThreeshold VALUE : set threeshold value for alert\n" +
            "!alert : toggles whether or not you want to receive gas alert based on threeshold"
          );
        }

        //  price command
        if (command == "gas") {
          getcurrentGas();
        }

        //  price command
        if (command == "setThreeshold") {
          var threeshold = param
          setThreeshold(threeshold)
		  channel.send("Threeshold is now set at " + alertThreeshold);
        }

        // alert command for toggling Ichimoku indicator
        if (command == "alert") {
          var indicator = param

          if      ( gas_alert === "on" ) { gas_alert = "off" }
          else if ( gas_alert === "off") { gas_alert = "on"  }

          channel.send("Gas alert is now " + gas_alert + "!");
        }
     }
});


client.login(process.env.BOTTOKEN);


