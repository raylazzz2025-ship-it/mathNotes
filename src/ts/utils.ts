export class Vec2D {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    Add(other: Vec2D): Vec2D {
        return new Vec2D(this.x + other.x, this.y + other.y);
    }

    Copy(): Vec2D {
        return new Vec2D(this.x, this.y);
    }

    static Zero(): Vec2D {
        return new Vec2D(0, 0);
    }
}

export class Bounds {
    width: number;
    baseLine: number;
    overBaseline: number;
    underBaseline: number;

    constructor(width: number, overBaseline: number, underBaseline: number, baseLine: number) {
        this.width = width;
        this.baseLine = baseLine;
        this.overBaseline = overBaseline;
        this.underBaseline = underBaseline;
    }

    get height(): number {
        return this.overBaseline + this.underBaseline;
    }

    static Zero(): Bounds {
        return new Bounds(0, 0, 0, 0);
    }
}
