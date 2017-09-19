/****************************************************************************************
* Module Includes
****************************************************************************************/
// electron modules
const electron = require('electron');
const ipc = require('electron').ipcRenderer;
const { dialog } = require('electron').remote;
var shell = require('electron').shell;

// path
const path = require('path');
// file system
const fs = require('fs');
// custom logging
const log = require('electron-log');

/****************************************************************************************
* Application Directories
****************************************************************************************/
const userDataPath = electron.remote.app.getPath('userData');


/****************************************************************************************
* Methods
****************************************************************************************/
$(document).ready(function () {
    $('#applicationTitle').html(`Testing Auto Update App v${0}.${1}.${0}`);
});


var camera, scene, renderer;
var geometry, material, mesh;

init();
animate();

function init() {
    let scene3D = document.getElementById("scene3D");
    let CANVAS_WIDTH = 300;
    let CANVAS_HEIGHT = 300;
    camera = new THREE.PerspectiveCamera(70, CANVAS_WIDTH / CANVAS_HEIGHT, 0.01, 10);
    camera.position.z = 1;

    scene = new THREE.Scene();

    geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    material = new THREE.MeshNormalMaterial();

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    scene3D.appendChild(renderer.domElement);
}

function animate() {

    requestAnimationFrame(animate);

    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;

    renderer.render(scene, camera);
}

let version = window.location.hash.substring(1);
document.getElementById('version').innerText = version;
// Listen for messages
ipc.on('message', function (event, text) {
    var container = document.getElementById('messages');
    var message = document.createElement('div');
    message.innerHTML = text;
    container.appendChild(message);
})
