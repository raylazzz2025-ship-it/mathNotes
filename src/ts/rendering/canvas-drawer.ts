import defaultRenderConfig from "./config";
import { Vec2D } from "../utils";

export class CanvasDrawer {
    static DrawText(
        context: CanvasRenderingContext2D,
        text: string,
        position: Vec2D,
        color: string,
        size: number = defaultRenderConfig.fontSize,
    ): void {
        context.font = `${size}px "Latin Modern"`;
        context.fillStyle = color;
        context.fillText(text, position.x, position.y);
    }

    static DrawLine(context: CanvasRenderingContext2D, start: Vec2D, end: Vec2D, color: string, width: number): void {
        context.strokeStyle = color;
        context.lineWidth = width;
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
    }

    static DrawSVG(
        context: CanvasRenderingContext2D,
        pathData: string,
        originalSize: Vec2D,
        position: Vec2D,
        size: Vec2D,
    ): void {
        const path = new Path2D(pathData);
        const scale = new Vec2D(size.x / originalSize.x, size.y / originalSize.y);

        context.save();

        context.translate(position.x, position.y);
        context.scale(scale.x, scale.y);

        context.fill(path);

        context.restore();
    }

    static DrawDashedLine(
        context: CanvasRenderingContext2D,
        start: Vec2D,
        end: Vec2D,
        color: string,
        width: number,
        dashPattern: number[] = [5, 5],
    ): void {
        context.strokeStyle = color;
        context.lineWidth = width;
        context.setLineDash(dashPattern);
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
        context.setLineDash([]); // Reset dash pattern
    }

    static DrawDashedRect(
        context: CanvasRenderingContext2D,
        position: Vec2D,
        size: Vec2D,
        color: string,
        lineWidth: number,
        dashPattern: number[] = [5, 5],
    ): void {
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.setLineDash(dashPattern);
        context.strokeRect(position.x, position.y, size.x, size.y);
        context.setLineDash([]); // Reset dash pattern
    }
}
