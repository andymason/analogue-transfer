var canvasOsc = document.querySelector('#canvas-oscilliscope');
var oscCtx = canvasOsc.getContext('2d');

var canvasFreq = document.querySelector('#canvas-freq');
var fCtx = canvasFreq.getContext('2d');

var canvas = document.querySelector('#canvas-output');
var ctx = canvas.getContext('2d');
var width = canvas.width;
var height = canvas.height;

var audiofile = 'morse-12wpm.mp3';
//var audiofile = 'broadcast.mp3';
var audioEl = document.createElement('audio');
audioEl.setAttribute('loop', true);
audioEl.setAttribute('src', audiofile);

var seconds = 2;
var actx = new AudioContext();
var frameCount = actx.sampleRate * seconds;
// 1 channel buffer, nSeconds long in frames at n sample rate
var aBuffer = actx.createBuffer(1, frameCount, actx.sampleRate);
var aMedia =actx.createMediaElementSource(audioEl);
var aBufferSource = actx.createBufferSource();
var aAnalyser = actx.createAnalyser();
aAnalyser.fftSize = 64;
aAnalyser.smoothingTimeConstant = 0;
var binCount = aAnalyser.frequencyBinCount;


var oscillator = actx.createOscillator();
oscillator.type = 1;
oscillator.frequency.value = 1000;
//oscillator.start();

var oscillator2 = actx.createOscillator();
oscillator2.type = 1;
oscillator2.frequency.value = 8000;
//oscillator2.start();


var gainNode = actx.createGain();
gainNode.gain.value = 1;

var data = aBuffer.getChannelData(0);
// Create sample white noise
for (var i = 0; i < data.length; i++) {
    //data[i] = Math.random() * 2  - 1;
    /*
    if (i % 2048 === 0) {
        for (var n = 0; n < ; n++) {
            data[i + n] = 1;
        }
    } else {
        //data[i] = -1;
    }
    */
    data[i] = Math.cos(i/9);
}


aMedia.connect(aAnalyser);
aAnalyser.connect(actx.destination);

//aBufferSource.buffer = aBuffer;
//aBufferSource.connect(aAnalyser);

//aMedia.connect(oscillator);
//oscillator.
//oscillator.connect(gainNode);
//gainNode.connect(aAnalyser);
//oscillator2.connect(aAnalyser);
//aAnalyser.connect(actx.destination);

aBufferSource.loop = true;


//aBufferSource.start(0);
audioEl.play();

oscCtx.strokeStyle = 'rgb(255, 0, 0)';
ctx.fillStyle = 'rgb(0,0,0)';

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

function drawOscilloscope(buffer) {
    oscCtx.clearRect(0, 0, width, height);
    oscCtx.beginPath();
    oscCtx.moveTo(0, height/2);
    for(var i = 0; i < buffer.length; i++) {
        oscCtx.lineTo(i, height/2 + buffer[i]);
    }
    oscCtx.moveTo(width, height/2);
    oscCtx.closePath();
    oscCtx.stroke();
}

var count = 0;


// Phase: 1s. Range: 10hz.

/*
        .
     .-==
    -====
      .-=
*/ 
var imageData = [
      0,   0,   0,  10,
      0,  30,  50, 100,
     20, 100, 150, 255,
      0,  30,  50,  10 
];

function modulator() {

}



fCtx.fillStyle = 'rgba(0, 0, 255, 0.5';



var beepLength = 0;
var gapLength = 0;

var minBins = 3;

var dotLength = 5; 
var dashLength = 16; 
var variationLength = 1;

function drawBoxes(data) {
    fCtx.clearRect(0, 0, width, height);
    for (var i = 0; i < data.length; i++) {
        fCtx.fillRect(i *10, 0,  10,  10+data[i]);
    }
    
    var binCount = 0;
    var hasBeep = _.find(data, function(sample) {
        if (sample > 210) binCount++;
        else binCount = 0;
        
        return binCount > minBins;
    });

    if (hasBeep) {
        beepLength++;
       
        // If gap length is not reset, reset and report
        if (gapLength > 0) {
            //console.log('Gap: ' + gapLength);
            gapLength = 0;
        }
    } else {
        gapLength++;

        if (beepLength > 0) {
            
            beeps.push(beepLength);

            //console.log('Beep: ' + beepLength);
            if (beepLength > beepLength && beepLength < 6) {
                console.log('Dot', beepLength);
            }

            if (beepLength > 10 && beepLength < 20) {
                console.log('Dash');
            }

            beepLength = 0;
        }
    }
}

var beeps = [];



function anim() {
  var buffer = new Uint8Array(binCount);
  aAnalyser.getByteFrequencyData(buffer);

  //console.log(_.max(buffer), buffer.length);

  drawBoxes(buffer);
  drawFreq(buffer);
  
  aAnalyser.getByteTimeDomainData(buffer);
  drawOscilloscope(buffer);
  requestAnimationFrame(anim);
}

anim();

