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

// Configure audio processing node
var processNode = audioctx.createScriptProcessor();
processNode.onaudioprocess = anim; 

mediaSource.connect(analyser);
analyser.connect(processNode);
processNode.connect(audioctx.destination);


var count = 0;

// TODO: Optimise. Only put 1px column of data instead of entire canvas
function drawFreq(freqData) {
  var imgData = ctx.getImageData(0, 0, width, height);
  for(var row = 0; row < height; row++) {
      var index = (width * height * 4) -(row * (width * 4)) + (count * 4);
      imgData.data[index] =  freqData[row];
      imgData.data[index + 1] = freqData[row];
      imgData.data[index + 2] = freqData[row];
      imgData.data[index + 3] = 255 ; //freqData[row];
  }
  ctx.putImageData(imgData, 0, 0);
  count += 1;
  if (count >= width) {
    count = 0;
  }
}

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
ctx.fillStyle = 'rgba(0, 0, 255, 0.5';

function drawBoxes(data) {
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < data.length; i++) {
        ctx.fillRect(i *10, 0,  10,  10+data[i]);
    }

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
  var input = event.inputBuffer.getChannelData(0);
  var output = event.outputBuffer.getChannelData(0);
  for (var i =0; i < output.length; i++) {
    output[i] = input[i];
  }


  var buffer = new Uint8Array(binCount);
  analyser.getByteFrequencyData(buffer);
  drawBoxes(buffer);
  freqScreen.draw(buffer);
  detectBeeps(buffer);
}



var FreqScreen = function(canvasEl) {
    this.el = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.width = canvasEl.getBoundingClientRect().width;
    this.height = canvasEl.getBoundingClientRect().height;
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
};

FreqScreen.prototype.draw = function(buffer) {
    if (!buffer) { return; }

    var grad = this.ctx.createLinearGradient(0,0, 1, this.height);
    for (var i = 0; i < buffer.length; i++) {
        var colour = this.colourScale(buffer[i]).hex();
        grad.addColorStop(i/buffer.length, colour);
    }
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(this.counter,0, 1, this.height);
    this.counter = (this.counter < this.width) ? this.counter + 1 : 0;
};

var freqScreen = new FreqScreen(document.querySelector('#canvas-freq'));
freqScreen.draw();

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


