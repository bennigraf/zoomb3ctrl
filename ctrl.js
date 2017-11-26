

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

var output = new easymidi.Output(outputs[1]);
output.send('program', {
  number: 0
});
output.close();


// gpio stuff directly from https://github.com/JamesBarwell/rpi-gpio.js
var gpio = require('rpi-gpio');

gpio.on('change', function(channel, value) {
	console.log('Channel ' + channel + ' value is now ' + value);
});
gpio.setup(7, gpio.DIR_IN, gpio.EDGE_BOTH);