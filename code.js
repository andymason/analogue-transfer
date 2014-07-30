var canvas = document.querySelector('#canvas-output');
console.log(canvas);
var ctx = canvas.getContext('2d');
var width = canvas.width;
var height = canvas.height;

//var audiofile = 'morse-12wpm.mp3';
var audiofile = 'broadcast.mp3';
var audioEl = document.createElement('audio');

audioEl.setAttribute('src', audiofile);
//audioEl.play();

var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext();
var mediaSource = audioContext.createMediaElementSource(audioEl);
var gainNode = audioContext.createGain();
var analyser = audioContext.createAnalyser();
var buffer;

analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0;
var binCount = analyser.frequencyBinCount;

mediaSource.connect(analyser);
analyser.connect(audioContext.destination);

/*
mediaSource.connect(gainNode);
gainNode.connect(audioContext.destination);

// Set gain to half
gainNode.gain.value = 0.5;
*/

//audioEl.play();

ctx.fillStyle = 'rgb(0,0,0)';

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

var count = 0;

audioEl.play();
console.log(binCount);
function anim() {
  buffer = new Uint8Array(binCount);
  analyser.getByteFrequencyData(buffer);
  drawFreq(buffer);
  requestAnimationFrame(anim);
}

anim();
