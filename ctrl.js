

var midi = require('midi');
var input = new midi.input();
console.log(input.getPortCount());
console.log(input.getPortName(1));

input.ignoreTypes(false, false, false);

input.closePort();


// out:

/*
// Manually would be: 
var output = new midi.output();
console.log('out: ', output.getPortName(1));
output.openPort(1);
output.sendMessage([192, 0]); // 192 is program change, the num is the number
*/

var easymidi = require('easymidi');

var outputs = easymidi.getOutputs();
console.log('outputs: ', outputs);

// ToDo: find zoom by name; only connect if it's there...
// var output = new easymidi.Output(outputs[1]);
// output.send('program', {
//   number: 0
// });
// output.close();


// gpio stuff directly from https://github.com/JamesBarwell/rpi-gpio.js
// var gpio = require('rpi-gpio');
// gpio.setMode(gpio.MODE_BCM);
//
// gpio.on('change', function(channel, value) {
//   console.log('Channel ' + channel + ' value is now ' + value);
// });
// gpio.setup(23, gpio.DIR_IN, gpio.EDGE_BOTH);
// gpio.setup(24, gpio.DIR_IN, gpio.EDGE_BOTH);
// gpio.setup(25, gpio.DIR_IN, gpio.EDGE_BOTH);
// gpio.destroy(function() {
  // console.log('All pins unexported');
// });

// try with different gpio lib which supports configuring pullup/-down inputs
var rpio = require('rpio');
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
var lastvalues = {
  16: rpio.read(16),
  18: rpio.read(18),
  22: rpio.read(22)
}

setInterval(function() {
  pins = [16, 18, 22];
  
  for (let i in pins) {
    pin = pins[i];
    value = rpio.read(pin);
    if (value != lastvalues[pin]) {
      console.log(pin + ':', value ? '⬆︎' : '⬇︎', (new Date()).toISOString());
      lastvalues[pin] = value;
    }
  }
}, 50);

