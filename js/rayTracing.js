import { Vec3 } from "./mathLib.js"
import { packRGBA, clamp, sampleHemisphereCosine } from "./mathLib.js";
import { RBuffer32, canvasWidth , canvasHeight, accumulationBuffer, sampleCount, maxBounces } from "./main.js";

export function clearBuffer(){
    RBuffer32.fill(0);
}

export function clearAccumulationBuffer(){
    for (let i = 0; i < accumulationBuffer.length; i++) {
        accumulationBuffer[i] = new Vec3(0, 0, 0);
    }
}

export class material
{
    constructor (color, emission, speculars, glass)
    {
        this.color = color
        this.emission = emission
        this.speculars = speculars
        this.glass = glass
    }
}
// A sphere in 3D space. Has centre, radius and colour all of which are Vec3s
export class Sphere
{
    constructor (pos, rad, mat)
    {
        this.pos = pos
        this.rad = rad
        this.mat = mat
    }
}

const simpleSpheres = new Array(
    // color, emission, roughness (unused), specular exponent, glass
    new Sphere(new Vec3(0, 0, -1),      0.3,    new material(new Vec3(255,0,0), 0, 50, 0)),
    new Sphere(new Vec3(-1, 0.2, -0.8),  0.15,   new material(new Vec3(0,0,255), 0, 10, 0)), 
    new Sphere(new Vec3(0,-900000.5, -1),  900000, new material(new Vec3(0,255,0), 0, 0, 0)),
    new Sphere(new Vec3(2, 1, -1), 0.1, new material(new Vec3(255,255,255), 10, 0, 0)) // light
);

const cornellSpheres = new Array(
    // Floor
    //new Sphere(new Vec3(0, -3.01, 0), 2.9, new material(new Vec3(255,255,255), 4, 0, 0)),
    // Ceiling (emissive)
    new Sphere(new Vec3(0, 100003, 0), 100000, new material(new Vec3(200,200,200), 0, 0, 0)),
    // Left wall (red)
    new Sphere(new Vec3(-100003, 0, 0), 100000, new material(new Vec3(255,100,100), 0, 0, 0)),
    // Right wall (green) 
    new Sphere(new Vec3(100003, 0, 0), 100000, new material(new Vec3(100,255,100), 0, 0, 0)),
    // Back sphere (white)
    new Sphere(new Vec3(0, 0, -100003), 100000, new material(new Vec3(255,255,255), 0, 0, 0)),
    // Floor sphere (white)
    new Sphere(new Vec3(0, -100003, 0), 100000, new material(new Vec3(255,255,255), 0, 0, 0)),

    // Left front sphere (red)
    new Sphere(new Vec3(0, 0, 0.6), 0.05, new material(new Vec3(210,210,210), 0, 0, 0)),
    // Left small sphere (blue)
    new Sphere(new Vec3(-0.06, -0.03, 0.65), 0.02, new material(new Vec3(0,150,210), 0, 0.1, 0)),
);

let spheres = cornellSpheres;

export function setPathTracingScene(isPathTracing) {
    spheres = isPathTracing ? cornellSpheres : simpleSpheres;
}


// Ray which has an origin and direction, both are Vec3s
export class Ray
{
    constructor (ori, dir)
    {
        this.ori = ori
        this.dir = dir
    }
}

export class hitResult
{
    constructor(hit, position, normal, dist, mat)
    {
        this.hit = hit
        this.position = position
        this.normal = normal
        this.dist = dist
        this.sphereIndex = -1
        this.mat = mat
    }
}

export function raySphereIntersects(ray, sphere) 
{
    const hitInfo = new hitResult(false, new Vec3(0, 0, 0), new Vec3(0, 0, 0), -1, -1);

    const offsetRayOrigin = ray.ori.minus(sphere.pos);

    const a = ray.dir.dot(ray.dir);
    const b = 2.0 * offsetRayOrigin.dot(ray.dir);
    const c = offsetRayOrigin.dot(offsetRayOrigin) - sphere.rad * sphere.rad;

    const discriminant = b * b - 4 * a * c;

    if (discriminant >= 0)
    {
        const dist = (-b - Math.sqrt(discriminant)) / (2.0 * a);

        if(dist >= 0)
        {
            hitInfo.hit = true;
            hitInfo.dist = dist;
            hitInfo.position = ray.ori.add(ray.dir.scale(dist));
            hitInfo.normal = hitInfo.position.minus(sphere.pos).normalised();
            hitInfo.mat = sphere.mat;
        }
    }
    return hitInfo;
}

export function CalculateRayCollision(ray)
{
    let closestHit = new hitResult(false, new Vec3(0, 0, 0), new Vec3(0, 0, 0), -1, -1);
    for(let i = 0; i < spheres.length; i++)
    {
        const hit = raySphereIntersects(ray, spheres[i]);
        if(hit.hit && (closestHit.dist < 0 || hit.dist < closestHit.dist))
        {
            closestHit = hit;
            closestHit.sphereIndex = i;
        }
    }
    return closestHit;
}


export function drawFrame(){
    // Simple pinhole camera: origin at (0,0,0), looking down -Z
    const aspect = canvasWidth / canvasHeight;
    const lightPos = new Vec3(5, 5, 0);

    for(let y = 0; y < canvasHeight; y++)
    {
        for(let x = 0; x < canvasWidth; x++)
        {
            const u = ((x + 0.5) / canvasWidth * 2 - 1) * aspect;
            const v = 1 - (y + 0.5) / canvasHeight * 2;

            const rayDir = new Vec3(u, v, -1).normalised();
            const hit = CalculateRayCollision(new Ray(new Vec3(0, 0, 0), rayDir));

            const pixel = hit.hit
                ? (() => {
                    const lightDir = lightPos.minus(hit.position).normalised();

                    const shadowRay = new Ray(hit.position.add(hit.normal.scale(0.001)), lightDir);
                    const shadowHit = CalculateRayCollision(shadowRay);

                    const baseColor = hit.mat.color.scale(1 / 255); // convert to 0..1 range

                    const viewDir = rayDir.scale(-1);
                    const reflectDir = lightDir.scale(-1).add(hit.normal.scale(2 * lightDir.dot(hit.normal))).normalised();
                    

                    const ambient = baseColor.scale(0.15);
                    const diffuseFactor = Math.max(0, hit.normal.dot(lightDir));
                    const diffuseColor = baseColor.scale(diffuseFactor);

                    const specularFactor = Math.pow(Math.max(0, viewDir.dot(reflectDir)), Math.max(1, hit.mat.speculars || 10));
                    const specularColor = new Vec3(1, 1, 1).scale(specularFactor);

                    const finalColor = ambient.add(diffuseColor).add(specularColor).multiply(shadowHit.hit && hit.sphereIndex != shadowHit.sphereIndex ? new Vec3(0.5, 0.5, 0.5) : new Vec3(1, 1, 1));

                    const r = Math.round(clamp(finalColor.x, 0, 1) * 255);
                    const g = Math.round(clamp(finalColor.y, 0, 1) * 255);
                    const b = Math.round(clamp(finalColor.z, 0, 1) * 255);

                    return packRGBA(r, g, b, 255);
                })()
                : (() => {
                    const t = (rayDir.y * 1.75 + 1) * 0.5;
                    const top = new Vec3(220, 240, 255);
                    const bottom = new Vec3(100, 150, 255);
                    const color = top.scale(t).add(bottom.scale(1 - t));
                    return packRGBA(Math.round(color.x), Math.round(color.y), Math.round(color.z), 255);
                })();

            RBuffer32[y * canvasWidth + x] = pixel;
        }
    }
}

function tracePath(ray, depth = 0) {
    // Accumulate radiance and throughput across bounces
    let throughput = new Vec3(1, 1, 1);
    let radiance = new Vec3(0, 0, 0);
    let currentRay = ray;

    for (let bounce = 0; bounce < maxBounces; bounce++) {
        const hit = CalculateRayCollision(currentRay);
        
        if (!hit.hit) {
            // No hit: black environment
            break;
        }

        // Get material
        const matColor = hit.mat.color.scale(1/255); // 0-1 range
        const emission = hit.mat.emission;

        // Add emissive contribution
        if (emission > 0) {
            radiance = radiance.add(throughput.multiply(matColor.scale(emission / 5)));
            break; // Stop at light source
        }

        // Add direct lighting (simplified: assume point light from ceiling)
        const lightPos = new Vec3(0, 0.99, 0);
        const toLight = lightPos.minus(hit.position).normalised();
        const directBright = Math.max(0, hit.normal.dot(toLight)) * 0.5 + 0.3;
        radiance = radiance.add(throughput.multiply(matColor.scale(directBright)));

        // Sample next direction (cosine-weighted hemisphere)
        const nextDir = sampleHemisphereCosine(hit.normal);
        const nextOrigin = hit.position.add(hit.normal.scale(0.001));
        
        currentRay = new Ray(nextOrigin, nextDir);
        throughput = throughput.multiply(matColor); // Update throughput
    }

    return radiance;
}

export function drawPathTracingFrame(){
    // Camera positioned inside the Cornell box, looking inward
    const aspect = canvasWidth / canvasHeight;
    const cameraPos = new Vec3(0, 0, 1.0);

    for(let y = 0; y < canvasHeight; y++)
    {
        for(let x = 0; x < canvasWidth; x++)
        {
            const u = ((x + Math.random()) / canvasWidth * 2 - 1) * aspect; // jitter for anti-aliasing
            const v = 1 - ((y + Math.random()) / canvasHeight * 2);

            const rayDir = new Vec3(u, v, -1).normalised();
            const color = tracePath(new Ray(cameraPos, rayDir));

            accumulationBuffer[y * canvasWidth + x] = accumulationBuffer[y * canvasWidth + x].add(color);

            const avgColor = accumulationBuffer[y * canvasWidth + x].scale(1 / sampleCount);

            const r = Math.round(clamp(avgColor.x, 0, 1) * 255);
            const g = Math.round(clamp(avgColor.y, 0, 1) * 255);
            const b = Math.round(clamp(avgColor.z, 0, 1) * 255);

            RBuffer32[y * canvasWidth + x] = packRGBA(r, g, b, 255);
        }
    }
}
