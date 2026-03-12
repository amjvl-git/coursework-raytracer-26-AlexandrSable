import { drawFrame, clearBuffer} from "./rayTracing.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });

export const canvasWidth = canvas.width
export const canvasHeight = canvas.height;

const img = ctx.createImageData(canvasWidth, canvasHeight);
export const RBuffer32 = new Uint32Array(img.data.buffer);



function renderFrame()
{
    clearBuffer();
    drawFrame();

    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(renderFrame);
}

requestAnimationFrame(renderFrame);