import { drawFrame, clearBuffer, drawPathTracingFrame, clearAccumulationBuffer, setPathTracingScene} from "./rayTracing.js";
import { Vec3 } from "./mathLib.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });

export const canvasWidth = canvas.width
export const canvasHeight = canvas.height;

const img = ctx.createImageData(canvasWidth, canvasHeight);
export const RBuffer32 = new Uint32Array(img.data.buffer);

export let accumulationBuffer = new Array(canvasWidth * canvasHeight).fill().map(() => new Vec3(0, 0, 0));
export let sampleCount = 0;
export let pathTracingEnabled = true;
export let maxBounces = 1;

const toggle = document.getElementById("pathTracingToggle");
toggle.addEventListener("change", () => {
    pathTracingEnabled = toggle.checked;
    sampleCount = 0;
    clearAccumulationBuffer();
    setPathTracingScene(pathTracingEnabled);
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