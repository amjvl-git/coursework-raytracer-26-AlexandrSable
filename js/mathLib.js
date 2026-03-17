export class Vec3
{
    constructor (x, y, z)
    {
        this.x = x
        this.y = y
        this.z = z
    }

    add(other)
    {
        return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    minus(other)
    {
        return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    multiply(other)
    {
        return new Vec3(this.x * other.x, this.y * other.y, this.z * other.z);
    }

    scale(scalar)
    {
        return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
    }
    
    dot(other)
    {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    length() 
    {
        return Math.sqrt(this.dot(this));
    }

    normalised() 
    {
        const len = this.length();
        if (len === 0) return new Vec3(0, 0, 0);
        return this.scale(1 / len);
    }
}

export function packRGBA(r, g, b, a = 255) {
    return (a << 24) | (b << 16) | (g << 8) | r;
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function random() {
    return Math.random();
}

export function randomVec3() {
    return new Vec3(random(), random(), random());
}

export function randomInUnitSphere() {
    while (true) {
        const p = randomVec3().scale(2).minus(new Vec3(1, 1, 1));
        if (p.dot(p) < 1) return p;
    }
}

export function randomInHemisphere(normal) {
    const inUnitSphere = randomInUnitSphere();
    if (inUnitSphere.dot(normal) > 0) {
        return inUnitSphere;
    } else {
        return inUnitSphere.scale(-1);
    }
}

export function cross(a, b) {
    return new Vec3(
        a.y * b.z - a.z * b.y,
        a.z * b.x - a.x * b.z,
        a.x * b.y - a.y * b.x
    );
}

export function sampleHemisphereCosine(normal) {
    const r1 = random();
    const r2 = random();
    const phi = 2.0 * Math.PI * r1;
    const r = Math.sqrt(r2);
    const x = r * Math.cos(phi);
    const y = r * Math.sin(phi);
    const z = Math.sqrt(Math.max(0, 1 - r2)); // cos theta

    // Build orthonormal basis
    let tangent;
    if (Math.abs(normal.x) > Math.abs(normal.z)) {
        tangent = new Vec3(-normal.y, normal.x, 0).normalised();
    } else {
        tangent = new Vec3(0, -normal.z, normal.y).normalised();
    }
    const bitangent = cross(normal, tangent);

    // Transform sample
    return tangent.scale(x).add(bitangent.scale(y)).add(normal.scale(z)).normalised();
}