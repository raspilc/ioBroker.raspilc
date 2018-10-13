/**
 *
 * raspilc adapter
 * supports MCP3204-module with 4 analogue inputs 12bit resolution and the
 * 1AI/1AO-module based on a MCP3201 and MCP4921 (used simultaneous)
 */

/* jshint -W097 */ // jshint strict             :false
/*jslint node                                  : true */
'use strict';

// you have to require the utils module and call adapter function
const utils = require(__dirname + '/lib/utils'); // Get common adapter utils

// you have to call the adapter function and pass a options object
// name has to be set and has to be equal to adapters folder name and main file name excluding extension
// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.raspilc.0
const adapter = new utils.Adapter('raspilc');

/*Variable declaration, since ES6 there are let to declare variables. Let has a more clearer definition where
it is available then var.The variable is available inside a block and it's childs, but not outside.
You can define the same variable name inside a child without produce a conflict with the variable of the parent block.*/
let variable = 1234;
const i2c = require('i2c-bus');
var Statelist = [];
var StateToSave = 0;
var framFound;
// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function(callback) {
  try {
    adapter.log.info('cleaned everything up...');
    callback();
  } catch (e) {
    callback();
  }
});

// is called if a subscribed object changes
//adapter.on('objectChange', function(id, obj) {
// Warning, obj can be null if it was deleted
//  adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
//});

//is called if a subscribed state changes
adapter.on('stateChange', function(id, state) {
  adapter.log.info('changed ID: ' + id + ' Value: ' + state.val);
  if (adapter.config.FRAM == true) {
    FRAMsave(Statelist.indexOf(id), state.val);
  } else return;
});


// you can use the ack flag to detect if it is status (true) or command (false)
//  if (state && !state.ack) {
//    adapter.log.info('ack is not set!');



// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', function(obj) {
  if (typeof obj === 'object' && obj.message) {
    if (obj.command === 'send') {
      // e.g. send email or pushover or whatever
      console.log('send command');

      // Send response in callback if required
      if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
    }
  }
});

function FRAMStartup() {
  //Check if FRAM is available:

  var i2cdet;
  if (adapter.config.FRAM == true) {

    const i2c1 = require('i2c-bus');
    const i2copen = i2c1.openSync(Number(adapter.config.i2cBusNo));
    i2cdet = i2copen.scanSync();
    framFound = i2cdet.indexOf(80);
    adapter.log.info('Detected devices: ' + i2cdet);

  };


  if ((adapter.config.FRAM == true) && (framFound >= 0)) {
    setTimeout(function() {
      Statelist = adapter.config.dp;
      Statelist = Statelist.split(",");
      for (var i = 0; i < Statelist.length; i++) {
        adapter.subscribeForeignStates(Statelist[i]);
        adapter.log.info(Statelist[i]);
      }

      if (framFound >= 0) {
        FRAMwrite();
      }
    }, Number(adapter.config.FRAM_load_delay));
  } else {
    adapter.log.info('WARNING! No FRAM found!!!');
    return;
  };
}

function FRAMwrite() {
  const FRAM_ADDR = 0x50;
  const i2c1 = i2c.openSync(Number(adapter.config.i2cBusNo));
  var DataBuf = new Buffer([0x00, 0x00]);
  var sendBytes = 0;
  var firstStart = false;
  var i = 0;
  var tempReceive = 0;

  for (i = 0; i < (Statelist.length); i++) {

    DataBuf[0] = i >>> 8; //Puffer in LOW- und HIGHbyte zerlegen
    DataBuf[1] = i % 255;

    i2c1.i2cWriteSync(0x50, 2, DataBuf); //Zeiger im FRAM auf Adresse setzen
    tempReceive = i2c1.receiveByteSync(0x50);

    if (tempReceive == 254) {
      adapter.setForeignState(Statelist[i], false);
      //  adapter.log.info("Objekt Name: " + Statelist[i] + " bool false written");
    } else if (tempReceive == 255) {
      adapter.setForeignState(Statelist[i], true);
      //  adapter.log.info("Objekt Name: " + Statelist[i] + " bool true written");
    } else if (tempReceive <= 253) {
      adapter.setForeignState(Statelist[i], tempReceive);
      //  adapter.log.info("Objekt Name: " + Statelist[i] + " number: " + tempReceive + " written");
    } else {
      adapter.log.info("Variable kann nicht geschrieben werden");
    }
    adapter.log.info("Objekt Name: " + Statelist[i] + " restored");
  }

  i2c1.closeSync();
}


function FRAMsave(StateToSave, valToWrite) {
  const i2c = require('i2c-bus');
  const FRAM_ADDR = 0x50;
  const i2c1 = i2c.openSync(Number(adapter.config.i2cBusNo));
  var temp;
  var temp2 = 0;
  var data = new Buffer([0x00, 0x00, 0x00]);
  var DataBuf = new Buffer([0x00, 0x00]);
  var sendBytes = 0;



  //  adapter.getState((Statelist[StateToSave]), function(err, state) {
  //    if (!err) {
  //      valToWrite = state.val;
  //  adapter.log.info('Variablentyp in Funktion: ' + typeof(valToWrite));

  //    }
  //  });

  if (valToWrite === true) { //Wenn BOOL > TRUE dann 255
    temp2 = 0xff;
  } else if (valToWrite === false) { //Wenn BOOL > FALSE dann 254
    temp2 = 0xfe;
  } else {
    if (valToWrite <= 253) {
      temp2 = Math.round(valToWrite); //Runden auf Ganzzahl!
    } else {
      adapter.log.info('Wert zu gross zum Speichern oder falscher Typ, ignoriert!')
    };
  };


  //Adresse in LOW-und HIGH-Byte zerlegen / Puffer aufbereiten


  data[0] = StateToSave >>> 8;
  data[1] = StateToSave % 255;
  data[2] = temp2;


  sendBytes = i2c1.i2cWriteSync(FRAM_ADDR, 3, data);
  //console.log("Transmitted bytes: " + sendBytes);
  i2c1.closeSync();
}


// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function() {

  main();
})

function main() {



  FRAMStartup();


  // The adapters config (in the instance object everything under the attribute "native") is accessible via
  // adapter.config                          :
  adapter.log.info('config FRAM             : ' + adapter.config.FRAM);
  adapter.log.info('config Module_inserted  : ' + adapter.config.Module_inserted);
  adapter.log.info('config mySelect         : ' + adapter.config.mySelect);
  adapter.log.info('config busNumber        : ' + adapter.config.busNum);
  adapter.log.info('config deviceNumber     : ' + adapter.config.devNum);
  adapter.log.info('config Startup-Delay    : ' + adapter.config.FRAM_load_delay);
  adapter.log.info('config i2c-bus          : ' + adapter.config.i2cBusNo);


  /**
   *
   * For every state in the system there has to be also an object of type state
   *
   * Here a simple raspilc for a boolean variable named "testVariable"
   *
   * Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
   *
   */

  if (adapter.config.Module_inserted == true && (adapter.config.mySelect == "4-AI-Module")) {

    adapter.setObject('Analog.Channel0', {
      type: 'state',
      common: {
        name: 'Channel0',
        type: 'number',
        role: 'indicator'
      },
      native: {}
    });

    adapter.setObject('Analog.Channel1', {
      type: 'state',
      common: {
        name: 'Channel1',
        type: 'number',
        role: 'indicator'
      },
      native: {}
    });

    adapter.setObject('Analog.Channel2', {
      type: 'state',
      common: {
        name: 'Channel2',
        type: 'number',
        role: 'indicator'
      },
      native: {}
    });

    adapter.setObject('Analog.Channel3', {
      type: 'state',
      common: {
        name: 'Channel3',
        type: 'number',
        role: 'indicator'
      },
      native: {}
    });

    read4AI();
    adapter.log.debug("Analogports lesen gestartet");
  } else if (adapter.config.Module_inserted == true && (adapter.config.mySelect == "1AI-1AO-Module")) {

    adapter.setObject('Analog.AnalogIn', {
      type: 'state',
      common: {
        name: 'AnalogIn',
        type: 'number',
        role: 'value'
      },
      native: {}
    });

    adapter.setObject('Analog.AnalogOut', {
      type: 'state',
      common: {
        name: 'AnalogOut',
        type: 'number',
        role: 'value'
      },
      native: {}
    });

  } else return;
  readwrite1AI1AO();
}
const spi = require('spi-device');

function read4AI() {
  var Interval = Number(adapter.config.Interval);
  var busNum = Number(adapter.config.busNum);
  var devNum = Number(adapter.config.devNum);

  //  const mcpadc = require('spi-device');


  adapter.setState('Analog.Channel0', 0);
  adapter.setState('Analog.Channel1', 0);
  adapter.setState('Analog.Channel2', 0);
  adapter.setState('Analog.Channel3', 0, read1);

}


function read1() {
  adapter.log.info("read1-Funktion gestartet");
  var Interval = Number(adapter.config.Interval);
  var busNum = Number(adapter.config.busNum);
  var devNum = Number(adapter.config.devNum);

  const mcpadc = require('spi-device');
  const mcp3204 = spi.open(busNum, devNum, (err) => {
    var i;
    for (i = 0; i < 4; i++) {
      (function(i) {
        setInterval(() => {

          const message = [{

            sendBuffer: Buffer.from([0x04, ((0x00 + i) << 6), 0x00]), // Sent to read
            receiveBuffer: Buffer.alloc(3), // received raw data
            byteLength: 3,
            speedHz: 20000
          }];
          if (err) throw err;

          mcp3204.transfer(message, (err, message) => {
            if (err) throw err;

            adapter.setState(('Analog.Channel' + i), (((message[0].receiveBuffer[1] & 0x0f) << 8) + message[0].receiveBuffer[2]), true);
          });
        }, Interval);
      })(i);
    }
  });

};




//*******ab hier 1AI-1AO-Modul!!!******


function readwrite1AI1AO() {



  adapter.setState('Analog.AnalogIn', 0);
  adapter.setState('Analog.AnalogOut', 0, readwrite);

  function readwrite() {
    var analogsend = 0;
    var Interval = adapter.config.Interval;
    var busNum = Number(adapter.config.busNum);
    var devNum = Number(adapter.config.devNum);
    const spi = require('spi-device');
    const mcp3201 = spi.open(busNum, devNum, (err) => {

      setInterval(() => {


        adapter.getState('Analog.AnalogOut', function(err, state) {
          analogsend = state.val;
        });

        if (analogsend > 4095) { //zu große Eingabe begrenzen
          analogsend = 4095;
        }

        const message = [{



          sendBuffer: Buffer.from([0x30 + (analogsend >> 8), analogsend & 0xff]), // Sent to read
          receiveBuffer: Buffer.alloc(2), // Raw data read
          byteLength: 2,
          speedHz: 20000
        }];

        if (err) throw err;

        mcp3201.transfer(message, (err, message) => {
          if (err) throw err;


          var analogIN = (((message[0].receiveBuffer[0] & 0x0F) << 8) + message[0].receiveBuffer[1]);
          adapter.setState('Analog.AnalogIn', analogIN, true);
        });
      }, Interval);
    });
  }
}
