import { Vec3 } from "./mathLib.js"
import { packRGBA, clamp } from "./mathLib.js";
import { RBuffer32, canvasWidth , canvasHeight } from "./main.js";

export function clearBuffer(){
    RBuffer32.fill(0);
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

const spheres = new Array(
    // color, emission, roughness (unused), specular exponent, glass
    new Sphere(new Vec3(0, 0, -1),      0.3,    new material(new Vec3(255,0,0), 0, 50, 0)),
    new Sphere(new Vec3(-1, 0.2, -0.8),  0.15,   new material(new Vec3(0,0,255), 0, 10, 0)), 
    new Sphere(new Vec3(0,-900000.5, -1),  900000, new material(new Vec3(0,255,0), 0, 0, 0))   
);


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
                    const baseColor = hit.mat.color.scale(1 / 255); // convert to 0..1 range

                    const viewDir = rayDir.scale(-1);
                    const reflectDir = lightDir.scale(-1).add(hit.normal.scale(2 * lightDir.dot(hit.normal))).normalised();
                    

                    const ambient = baseColor.scale(0.15);
                    const diffuseFactor = Math.max(0, hit.normal.dot(lightDir));
                    const diffuseColor = baseColor.scale(diffuseFactor);

                    const specularFactor = Math.pow(Math.max(0, viewDir.dot(reflectDir)), Math.max(1, hit.mat.speculars || 10));
                    const specularColor = new Vec3(1, 1, 1).scale(specularFactor);

                    const finalColor = ambient.add(diffuseColor).add(specularColor);

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
