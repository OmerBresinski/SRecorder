const { desktopCapturer, remote } = require("electron");
const { writeFile } = require("fs");
const { Menu, dialog } = remote;
const FILE_TYPE = "video/webm; codecs=vp9";

const videoElement = document.querySelector("video");
const startBtn = document.querySelector("#startBtn");
const stopBtn = document.querySelector("#stopBtn");
const srcSelect = document.querySelector("#videoSelect");

const recordedChunks = [];
let mediaRecorder;

srcSelect.addEventListener("click", getVideoSources);
startBtn.addEventListener("click", handleStartRecording);
stopBtn.addEventListener("click", handleStopRecording);

function handleStartRecording() {
    mediaRecorder.start();
    startBtn.innerText = "Recording";
}

function handleStopRecording() {
    mediaRecorder.stop();
    startBtn.innerText = "Start";
}

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ["window", "screen"]
    });
    const videoOptionsMenu = getVideoOptions(inputSources);
    videoOptionsMenu.popup();
}

function getVideoOptions(inputSources) {
    return Menu.buildFromTemplate(
        inputSources.map(src => {
            return {
                label: src.name,
                click: () => selectSource(src)
            };
        })
    );
}

async function selectSource(source) {
    srcSelect.innerText = source.name;
    const recordingParams = getRecordingParams(source);
    const previewStream = await navigator.mediaDevices.getUserMedia(
        recordingParams
    );
    playPreview(previewStream);
    const saveOptions = { mimeType: FILE_TYPE };
    mediaRecorder = new MediaRecorder(previewStream, saveOptions);
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
    recordedChunks.push(e.data);
}

async function handleStop() {
    const blob = new Blob(recordedChunks, {
        type: FILE_TYPE
    });
    const buffer = Buffer.from(await blob.arrayBuffer());
    const { filePath } = await dialog.showSaveDialog({
        button: "Save Video",
        defaultPath: `screenRecording-${Date.now()}.webm`
    });
    writeFile(filePath, buffer, () => {
        console.log("File saved successfully.");
    });
}

function playPreview(previewStream) {
    videoElement.srcObject = previewStream;
    videoElement.play();
}

function getRecordingParams(source) {
    return {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: source.id
            }
        }
    };
}
