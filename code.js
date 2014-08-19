var mediaEl = document.querySelector('#sample-video');
//var mediaEl = document.querySelector('#sample-audio');
var canvas = document.querySelector('#canvas-out');
var ctx = canvas.getContext('2d');
var width = canvas.getBoundingClientRect().width;
var height = canvas.getBoundingClientRect().height;


var seconds = 2;
var audioctx = new AudioContext();
var frameCount = audioctx.sampleRate * seconds;

// 1 channel buffer, nSeconds long in frames at n sample rate
var buffer = audioctx.createBuffer(1, frameCount, audioctx.sampleRate);
var mediaSource = audioctx.createMediaElementSource(mediaEl);
var bufferSource = audioctx.createBufferSource();

// Configure analyser node
var analyser = audioctx.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0;
var binCount = analyser.frequencyBinCount;
var sampleRate = audioctx.sampleRate;

// Filter
var filterNode = audioctx.createBiquadFilter();
filterNode.type = 'bandpass';
filterNode.frequency.value = 0;
filterNode.Q.value = 1000;

var qInput = document.querySelector('#q');
qInput.addEventListener('change', function(e) {
    filterNode.Q.value = e.target.value;
    console.log(e.target.value);
});

var freqInput = document.querySelector('#freq');
freqInput.addEventListener('change', function(e) {
    filterNode.frequency.value = e.target.value;
});

// Configure audio processing node
var processNode = audioctx.createScriptProcessor();
processNode.onaudioprocess = anim; 

mediaSource.connect(filterNode);
filterNode.connect(analyser);
analyser.connect(processNode);
processNode.connect(audioctx.destination);


var count = 0;
var beepLength = 0;
var gapLength = 0;
var minBins = 1;
var dotLength = 5; 
var dashLength = 16; 
var variationLength = 1;
var currentUnit = '';
var gaps = [];
var beeps = [];
var sentence = '';

// Set fill style
ctx.fillStyle = 'rgba(0, 0, 255, 1';
ctx.strokeStyle = '#0F0';
var verticalRatio = height / 255;
var horiztonalRatio = width / binCount;

function drawBoxes(data) {
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    for (var i = 0; i < data.length; i++) {
        if (i === 0) {
            ctx.moveTo(i, data[i] * verticalRatio);
        } else {
            ctx.lineTo(i * horiztonalRatio, data[i] * verticalRatio);
        }
    }
    ctx.stroke();
    ctx.closePath();
}


function detectBeeps(data) {
    var binCount = 0;
    var hasBeep = _.find(data, function(sample) {
        if (sample >= 255) binCount++;
        else binCount = 0;
        return binCount > minBins;
    });

    if (hasBeep) {
        beepLength++;
        // If gap length is not reset, reset and report
        if (gapLength > 0) {
            gaps.push(gapLength);

            // Short gap between char units
            if (gapLength === 6 || gapLength == 7) {
                sentence+=decode(currentUnit);
                console.log(currentUnit);
                currentUnit = '';
                console.log(sentence);
            }
    
            // Long gap between words
            if (gapLength == 10 || gapLength == 11) {
                sentence+=decode(currentUnit);
                sentence += ' ';
                currentUnit = '';
            }

            gapLength = 0;
        }
    } else {
        gapLength++;

        if (beepLength > 0) {
            beeps.push(beepLength);
            
            // Detect dot
            if (beepLength > 1 && beepLength < 4) {
                currentUnit += '.';
            }

            // Detect dash
            if (beepLength > 5 && beepLength < 8) {
                currentUnit += '-';
            }

            beepLength = 0;
        }
    }
}


function decode(input) {
    var result = _.filter(morse, function(charData) {
        return charData[2] === input;
    });
    return (result && result[0]) ? result[0][1] : '';
}


function anim(event) {
  if (mediaEl.paused === true) {
    return;
  }

  var input = event.inputBuffer.getChannelData(0);
  var output = event.outputBuffer.getChannelData(0);
  for (var i =0; i < output.length; i++) {
    output[i] = input[i];
  }


  var buffer = new Uint8Array(binCount);
  analyser.getByteTimeDomainData(buffer);
  drawBoxes(buffer);
  analyser.getByteFrequencyData(buffer);
  freqScreen.draw(buffer);
  detectBeeps(buffer);
}



var FreqScreen = function(canvasEl) {
    this.el = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.width = canvasEl.getBoundingClientRect().width;
    this.height = canvasEl.getBoundingClientRect().height * verticalRatio;
    this.pixelSampleRateRatio = this.height / (audioctx.sampleRate / 2);
    this.freqRange = new ConvertRange([0, this.height], [0, sampleRate/2]);
    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.qRange2Height = new ConvertRange([0.0001, 1000], [0, this.height]);
    this.qRange = new ConvertRange([0, this.height/3], [10, 0.001]);
    this.qHeight = this.qRange2Height(filterNode.Q.value);

    this.colourScale = chroma.scale([
        'black',
        'purple',
        'blue',
        'cyan',
        'green',
        'yellow',
        'orange',
        'red',
    ]).domain([0, 255]);

    this.counter = 0;
    this.ui = new Hammer(canvasEl, {});

    this.handleTap = function(ev) {
        var pos = this.calcCenter(ev.center);
        filterNode.frequency.value = this.freqRange(pos.y);
    };

    this.handlePan = function(ev) {
        var deltaY = Math.abs(ev.deltaX);
        deltaY = (deltaY > this.height/3) ? this.height/3 : deltaY;
        this.qHeight = deltaY;
        filterNode.Q.value = Math.abs(this.qRange(deltaY));
        console.log(Math.abs(this.qRange(deltaY)));
    };

    this.calcCenter = function(center) {
        var bounds = this.el.getBoundingClientRect();
        return { x: center.x - bounds.left, y: center.y - bounds.top };
    };

    this.ui.on('tap', this.handleTap.bind(this));
    this.ui.on('pan', this.handlePan.bind(this));
};


FreqScreen.prototype.draw = function(buffer) {
    if (!buffer) { return; }

    this.ctx.putImageData(this.imageData, 0, 0);

    var grad = this.ctx.createLinearGradient(0,0, 1, this.height);
    for (var i = 0; i < buffer.length; i++) {
        var colour = this.colourScale(buffer[i]).hex();
        grad.addColorStop(i/buffer.length, colour);
    }
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(this.counter,0, 1, this.height);
    this.counter = (this.counter < this.width) ? this.counter + 1 : 0;

    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);

    
    // Draw band filter frequency line
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    var filterY = this.pixelSampleRateRatio * filterNode.frequency.value; 
    filterY = Math.round(filterY);
    this.ctx.fillRect(0, filterY, this.width, 1);

    // Draw band filter Q range
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    this.ctx.fillRect(0, filterY - this.qHeight/2, this.width, this.qHeight);
};

var freqScreen = new FreqScreen(document.querySelector('#canvas-freq'));


function ConvertRange(r1, r2) {
    return function(val) {
        var range1 = r1;
        var range2 = r2;
        return ( val - range1[ 0 ] ) * (range2[1] - range2[0] ) / ( range1[1] - range1[0] ) + range2[0];
    };
}


// Morse code look-up table
var morse = [
  [ "0", "0", "-----" ],
  [ "1", "1", ".----" ],
  [ "2", "2", "..---" ],
  [ "3", "3", "...--" ],
  [ "4", "4", "....-" ],
  [ "5", "5", "....." ],
  [ "6", "6", "-...." ],
  [ "7", "7", "--..." ],
  [ "8", "8", "---.." ],
  [ "9", "9", "----." ],

  [ "A", "a", ".-" ],
  [ "B", "b", "-..." ],
  [ "C", "c", "-.-." ],
  [ "D", "d", "-.." ],
  [ "E", "e", "." ],
  [ "F", "f", "..-." ],
  [ "G", "g", "--." ],
  [ "H", "h", "...." ],
  [ "I", "i", ".." ],
  [ "J", "j", ".---" ],
  [ "K", "k", "-.-" ],
  [ "L", "l", ".-.." ],
  [ "M", "m", "--" ],
  [ "N", "n", "-." ],
  [ "O", "o", "---" ],
  [ "P", "p", ".--." ],
  [ "Q", "q", "--.-" ],
  [ "R", "r", ".-." ],
  [ "S", "s", "..." ],
  [ "T", "t", "-" ],
  [ "U", "u", "..-" ],
  [ "V", "v", "...-" ],
  [ "W", "w", ".--" ],
  [ "X", "x", "-..-" ],
  [ "Y", "y", "-.--" ],
  [ "Z", "z", "--.." ],

  [ "PERIOD", ".", ".-.-.-" ],
  [ "COMMA", ",", "--..--" ],
  [ "QUESTION_MARK", "?", "..--.." ],
  [ "APOSTROPHE", "'", ".----." ],
  [ "EXCLAMATION_MARK", "!", "-.-.--" ],
  [ "SLASH", "/", "-..-." ],
  [ "OPEN_PAREN", "(", "-.--.-" ],
  [ "CLOSE_PAREN", ")", "-.--.-" ],
  [ "AMPERSAND", "&", ".-..." ],
  [ "COLON", ":", "---..." ],
  [ "SEMI_COLON", ";", "-.-.-." ],
  [ "EQUALS", "=", "-...-" ],
  [ "PLUS", "+", ".-.-." ],
  [ "MINUS", "-", "-....-" ],
  [ "UNDERSCORE", "_", "..--.-" ],
  [ "DOUBLE_QUOTE","\"", ".-..-." ],
  [ "DOLLAR_SIGN", "$", "...-..-" ],
  [ "AT_SIGN", "@", ".--.-." ]
];


