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