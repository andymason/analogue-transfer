var canvas = document.querySelector('#canvas-output');
var ctx = canvas.getContext('2d');
var width = canvas.width;
var height = canvas.height;

//var audiofile = 'morse-12wpm.mp3';
var audiofile = 'broadcast.mp3';
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
aAnalyser.fftSize = 2048;
var binCount = aAnalyser.frequencyBinCount;



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

aBufferSource.buffer = aBuffer;
//aBufferSource.connect(aAnalyser);

aMedia.connect(aAnalyser);
aAnalyser.connect(actx.destination);
aBufferSource.loop = true;


//aBufferSource.start(0);
audioEl.play();


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

var count = 0;

function anim() {
  var buffer = new Uint8Array(binCount);
  aAnalyser.getByteFrequencyData(buffer);
  drawFreq(buffer);
  requestAnimationFrame(anim);
}

anim();

