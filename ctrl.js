
// var midi = require('midi');
// var input = new midi.input();
// console.log(input.getPortCount());
// console.log(input.getPortName(1));

// input.ignoreTypes(false, false, false);

// input.closePort();


// out:

/*
// Manually would be: 
var output = new midi.output();
console.log('out: ', output.getPortName(1));
output.openPort(1);
output.sendMessage([192, 0]); // 192 is program change, the num is the number
*/


var rpio = require('rpio');
var ZoomB3 = require('./ZoomB3.js');

const EventEmitter = require('events'); // used for ButtonEmitter class

var zoom = new ZoomB3();

// for now delay connection a tiny little bit because I define a 'connected' event
// handler further down below this script
setTimeout(function() {
  zoom.connect();
}, 500);



// try with different gpio lib which supports configuring pullup/-down inputs
rpio.open(16, rpio.INPUT, rpio.PULL_UP); // 18, 22
console.log('Pin 16 is currently set ' + (rpio.read(16) ? 'high' : 'low'));

rpio.open(18, rpio.INPUT, rpio.PULL_UP);
console.log('Pin 18 is currently set ' + (rpio.read(18) ? 'high' : 'low'));

rpio.open(22, rpio.INPUT, rpio.PULL_UP);
console.log('Pin 22 is currently set ' + (rpio.read(22) ? 'high' : 'low'));


// rpio.poll works kind of unsatisfactory (emits lots of 'false postivies'), so use
// manual polling as below
// rpio.poll(16, pollcallback);

// 2nd approach: just keep reading manually
// use inline class for now as event emitter helper
class ButtonEmitter extends EventEmitter {
  constructor() {
    super();
    
    this.lastvalues = {
      16: rpio.read(16),
      18: rpio.read(18),
      22: rpio.read(22)
    }
  }
  
  update(pin, value) {
    if (value != this.lastvalues[pin]) {
      console.log(pin + ':', value ? '⬆︎' : '⬇︎', (new Date()).toISOString());
      console.log('event:', pin.toString() + '-' + (value ? 'up' : 'down'));
      this.emit(pin.toString() + '-' + (value ? 'up' : 'down'));
      this.lastvalues[pin] = value;
    }
  }
}
var buttonEmitter = new ButtonEmitter();

setInterval(function() {
  pins = [16, 18, 22];
  
  for (let i in pins) {
    pin = pins[i];
    buttonEmitter.update(pin, rpio.read(pin));
  }
}, 50);

// setup event emitters once zoom is connected
zoom.on('connected', function() {
  buttonEmitter.on('16-down', function() {
    zoom.previousPatch();
  });
  buttonEmitter.on('22-down', function() {
    zoom.nextPatch();
  });
});

let net = require('net');
let client = new net.Socket();
client.on('close', function() {
  console.log('Connection closed');
});
client.on('error', function(e) {
  console.log('Error!');
  console.log(e);
});

zoom.on('patchname', function(patchname) {
  console.log('setting patchname to display...');
  client.connect(3024, '127.0.0.1', function() {
  	console.log('Connected, writing...');
  	client.write(patchname);
  });
});
