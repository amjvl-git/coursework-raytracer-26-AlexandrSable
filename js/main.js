import { drawFrame, clearBuffer, drawPathTracingFrame, clearAccumulationBuffer, setScene, setLightPosition } from "./rayTracing.js";
import { Vec3 } from "./mathLib.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });

export let canvasWidth = 512;
export let canvasHeight = 512;

let img = ctx.createImageData(canvasWidth, canvasHeight);
export let RBuffer32 = new Uint32Array(img.data.buffer);

export let accumulationBuffer = new Array(canvasWidth * canvasHeight).fill().map(() => new Vec3(0, 0, 0));
export let sampleCount = 0;
export let pathTracingEnabled = false;
export let maxBounces = 3;

export function resizeCanvas(width, height) {
    canvas.width = width;
    canvas.height = height;

    canvasWidth = width;
    canvasHeight = height;

    img = ctx.createImageData(canvasWidth, canvasHeight);
    RBuffer32 = new Uint32Array(img.data.buffer);
    accumulationBuffer = new Array(canvasWidth * canvasHeight).fill().map(() => new Vec3(0, 0, 0));

    sampleCount = 0;
    clearBuffer();
    clearAccumulationBuffer();
}

const toggle = document.getElementById("pathTracingToggle");
toggle.addEventListener("change", () => {
    pathTracingEnabled = toggle.checked;
    sampleCount = 0;
    clearAccumulationBuffer();
});

const sceneSelect = document.getElementById("sceneSelect");
sceneSelect.addEventListener("change", () => {
    setScene(sceneSelect.value);
    sampleCount = 0;
    clearAccumulationBuffer();
});

const bouncesSlider = document.getElementById("bouncesSlider");
const bouncesValue = document.getElementById("bouncesValue");
bouncesSlider.addEventListener("input", () => {
    maxBounces = parseInt(bouncesSlider.value);
    bouncesValue.textContent = maxBounces;
    if (pathTracingEnabled) {
        sampleCount = 0;
        clearAccumulationBuffer();
    }
});

const resolutionSelect = document.getElementById("resolutionSelect");
resolutionSelect.addEventListener("change", () => {
    const [w, h] = resolutionSelect.value.split("x").map(Number);
    resizeCanvas(w, h);
});

// Initialize render buffers to match the default resolution
resizeCanvas(canvasWidth, canvasHeight);

// Initialize scene to match the UI defaults
setScene(document.getElementById("sceneSelect").value);

// Light position sliders
const lightXSlider = document.getElementById("lightXSlider");
const lightYSlider = document.getElementById("lightYSlider");
const lightZSlider = document.getElementById("lightZSlider");
const lightXValue = document.getElementById("lightXValue");
const lightYValue = document.getElementById("lightYValue");
const lightZValue = document.getElementById("lightZValue");

function updateLightPosition() {
    const x = parseFloat(lightXSlider.value);
    const y = parseFloat(lightYSlider.value);
    const z = parseFloat(lightZSlider.value);
    
    lightXValue.textContent = x.toFixed(1);
    lightYValue.textContent = y.toFixed(1);
    lightZValue.textContent = z.toFixed(1);
    
    setLightPosition(x, y, z);
    sampleCount = 0;
    clearAccumulationBuffer();
}

lightXSlider.addEventListener("input", updateLightPosition);
lightYSlider.addEventListener("input", updateLightPosition);
lightZSlider.addEventListener("input", updateLightPosition);

function renderFrame()
{
    if (pathTracingEnabled) {
        sampleCount++;
        drawPathTracingFrame();
    } else {
        clearBuffer();
        drawFrame();
    }

    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(renderFrame);
}

requestAnimationFrame(renderFrame);