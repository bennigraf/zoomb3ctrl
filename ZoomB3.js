var easymidi = require('easymidi');
const EventEmitter = require('events');

var _lang = require('lodash/lang');

class ZoomB3 extends EventEmitter {
  
  constructor() {
    super();
    
    console.log('Hello Zoom!');
    this.input = null;
    this.output = null;
    
    this.currentPatchNum = null;
    
    this.setupEvents();
  }
  
  setupEvents() {
    this.on('connected', function() {
      // setup midi receving hooks
      this.input.on('sysex', this.recvdSysex.bind(this));
      this.input.on('program', this.recvdProgram.bind(this));
      
      // make zoom handshake
      this.makeHandshake();
    }.bind(this));
  }
  
  makeHandshake() {
    // say hi to the zoom...
    // according to https://www.thegearpage.net/board/index.php?threads/midi-control-of-zoom-g3-video.1033719/page-3#post-22169506
    console.log('saying hi to zoom');
    
    this.once('recvdSysex', function(bytes) {
      const expecting = [0xf0, 0x7e, 0, 0x06, 0x02, 0x52, 0x4f, 0, 0, 0, 0x31, 0x2e, 0x32, 0x30, 0xf7];
      
      if (_lang.isEqual(bytes, expecting)) {
        // go into edit mode
        console.log('setting edit mode');
        this.send('sysex', [0xf0, 0x52, 0x00, 0x4f, 0x50, 0xf7]); // replace 5a with 4f for B3
        // the command (0x50) seems to only work sometimes. not sure about it yet.
        
        console.log('requesting current program');
        this.send('sysex', [0xf0, 0x52, 0x00, 0x4f, 0x33, 0xf7]); // replace 5a with 4f for B3
        // this causes a program change to be received etc.
      }
    }.bind(this));
    
    // device discovery
    this.send('sysex', [0xf0, 0x7e, 0x00, 0x06, 0x01, 0xf7]);
    
    // expecting specific response, see callback above...
  }
  
  recvdSysex(msg) {
    // check for patch info
    if (msg.bytes[4] == 0x28) {
      let patchname = msg.bytes.slice(55, 67);
      // let patchname = msg.bytes.length;
      console.log('patch:', patchname);
      let patchnameString = patchname.map(function(v) { return String.fromCharCode(v) });
      console.log(patchnameString);
      let patchnameBuffer = new Buffer.from(patchnameString);
      console.log(patchnameBuffer);
      this.emit('patchname', patchnameBuffer);
    } else {
      console.log('recvd input:', msg.bytes.map(function(v) { return v.toString(16) }));
    }
    
    // emit general event where one can hook up to
    this.emit('recvdSysex', msg.bytes);
  }
  
  recvdProgram(msg) {
    console.log('recvd program:', msg);
    this.currentPatchNum = msg.number;
    
    console.log('requesting patch info');
    this.send('sysex', [0xf0, 0x52, 0x00, 0x4f,  0x29, 0xf7]); // replace 5a with 4f for B3
  }
  
  connect() {
    // until there's a connection, this will repeatedly try to connect
    // ToDo: check what happens on dis-/reconnect
    var output = this.connectOut();
    var input = this.connectIn();
    
    if (output === null || input === null) {
      console.log('no connection, retry...');
      setTimeout(this.connect.bind(this), 1000);
    } else {
      this.output = output;
      this.input = input;
      this.emit('connected');
    }
  }

  connectOut() {
    var outputs = easymidi.getOutputs();
    console.log('outputs:', outputs);

    // ToDo: find zoom by name; only connect if it's there...
    // get output (to zoom)
    var output = null;
    for (let i in outputs) {
      if (outputs[i].substr(0, 13) == 'ZOOM G Series') {
        output = new easymidi.Output(outputs[i]);
        break;
      }
    }

    console.log('output:', output);
    return output;
  }

  connectIn() {
    // get input (from zoom)
    var inputs = easymidi.getInputs();
    console.log('inputs:', inputs);

    var input = null;
    for (let i in inputs) {
      if (inputs[i].substr(0, 13) == 'ZOOM G Series') {
        input = new easymidi.Input(inputs[i]);
        break;
      }
    }
    
    console.log('input:', input);
    return input;
  }
  
  send(type, data) {
    if (this.output === null) {
      console.log("Zoom: Cannot send - no midi connection");
      return;
    }
    
    if (type == 'sysex') {
      this.output.send('sysex', data);
    }
  }
  
  nextPatch() {
    this.currentPatchNum = (this.currentPatchNum + 1) % 100;
    this.output.send('program', {
      number: this.currentPatchNum
    });
    console.log('new patch: ', this.currentPatchNum);
    
    console.log('requesting patch info');
    this.send('sysex', [0xf0, 0x52, 0x00, 0x4f,  0x29, 0xf7]); // replace 5a with 4f for B3
  }
  
  previousPatch() {
    this.currentPatchNum -= 1;
    if (this.currentPatchNum < 0) {
      this.currentPatchNum = 99;
    }
    this.output.send('program', {
      number: this.currentPatchNum
    });
    console.log('new patch: ', this.currentPatchNum);
    
    console.log('requesting patch info');
    this.send('sysex', [0xf0, 0x52, 0x00, 0x4f,  0x29, 0xf7]); // replace 5a with 4f for B3
  }
}

module.exports = ZoomB3;
