/*
*  Copyright (c) 2019 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

'use strict';

const webSocketURL ="wss://object.zhichao.site:6443/ws/"
const source = document.querySelector('video');
// TODO(hta): Use OffscreenCanvas for the intermediate canvases.
const canvasIn = document.querySelector('#canvas-source');
const canvasOut = document.querySelector('#canvas-result');
//const result = document.getElementById("result");
const support = document.getElementById('errorMsg');
const stream = canvasOut.captureStream();
//var ws = new WebSocket("ws://localhost:8080");
const audioInputSelect = document.querySelector('select#audioSource');
const audioOutputSelect = document.querySelector('select#audioOutput');
const videoSelect = document.querySelector('select#videoSource');
const selectors = [videoSelect];

let inputStream = null;
let imageData = null;
var ctx
var wss
//result.srcObject = stream;
function webSocket(){
  if("WebSocket" in window){
    console.log("您的浏览器支持WebSocket");
    try {
      wss = new WebSocket(webSocketURL); //创建WebSocket连接
    } catch (e) {
      support.innerHTML += `chorme do not support canvas! error: ${JSON.stringify(e)}`;

    }
    //...
  }else{
    console.log("您的浏览器不支持WebSocket");
    support.innerHTML += `chorme  does not support WebSocket error 3`

  }
}

function loop() {
  if (source.videoWidth > 0 && source.videoHeight > 0) {
   // support.innerHTML += `chorme do not support canvas! error 3`
    canvasIn.width = source.videoWidth;
    canvasIn.height = source.videoHeight;

    try {
      ctx = canvasIn.getContext('2d');
    } catch (e) {
      support.innerHTML += `chorme do not support canvas! error: ${JSON.stringify(e)}`;
    }
    ctx.drawImage(source, 0, 0);
    var newblob = canvasIn.toDataURL('image/jpeg', 0.5);
  //  console.log(newblob);
    sleep(100)
    wss.send(newblob);
  }
  window.requestAnimationFrame(loop);
}

function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    const values = selectors.map(select => select.value);
    selectors.forEach(select => {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        // if (deviceInfo.kind === 'audioinput') {
        //     option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
        //     audioInputSelect.appendChild(option);
        // } else if (deviceInfo.kind === 'audiooutput') {
        //     option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
        //     audioOutputSelect.appendChild(option);
        // } else if (deviceInfo.kind === 'videoinput') {

        if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        } else {
            console.log('Some other kind of source/device: ', deviceInfo);
        }
    }
    selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
            select.value = values[selectorIndex];
        }
    });
}

function start() {
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    // const audioSource = audioInputSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {

        video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    };
    navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
    window.requestAnimationFrame(loop);
}

function gotStream(stream) {
    window.stream = stream; // make stream available to console
    source.srcObject = stream;
    source.play()
    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

webSocket();
start();
videoSelect.onchange = start;

//
// (async () => {
//   inputStream = await navigator.mediaDevices.getUserMedia({video: true});
//
//   source.srcObject = inputStream;
//   source.play();
//  // result.play();
//   window.requestAnimationFrame(loop);
// })();

wss.onmessage = function (msg) {
  console.log(msg.data)
  var objectInfo = JSON.parse(msg.data.replace(/[\r\n]/g,""));
  ctx.drawImage(source, 0, 0);
  ctx.strokeStyle = '#FF0000';
  ctx.font = '30px serif';
  ctx.fillStyle = '#FF0000'
  var objects = objectInfo["Objects"];
  console.log(objects);

  for (let i = 0; i != objectInfo["Amount"]; ++i){
    var ob =objects[i];
    console.log(ob);
    // Put a red square into the image, to mark the objects
    var leftX = ob["X"]-ob["Width"]/2;
    var leftY = ob["Y"]-ob["Hight"]/2;
    console.log(leftX, leftY, ob["Width"], ob["Hight"]);
    ctx.strokeRect(leftX, leftY, ob["Width"], ob["Hight"]);
    ctx.fillText(ob["Object"], leftX, leftY);
  }
  imageData = ctx.getImageData(0, 0, canvasIn.width, canvasIn.height);
  // At this point, we have data that can be transferred.
  // We paint it on the second canvas.
  canvasOut.width = source.videoWidth;
  canvasOut.height = source.videoHeight;
  const outCtx = canvasOut.getContext('2d');
  outCtx.putImageData(imageData, 0, 0);

}


var sleep = function(time) {
  var startTime = new Date().getTime() + parseInt(time, 10);
  while(new Date().getTime() < startTime) {}
};