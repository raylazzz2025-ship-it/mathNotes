import { Token } from "./tokenizer";

interface renderingData {
    width: number;
    height: number;
    position: vec2d;
}

type TokenRenderer = (token: Token, parent: HTMLCanvasElement, context: CanvasRenderingContext2D, RD: renderingData) => void;

class vec2d {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(other: vec2d): vec2d {
        return new vec2d(this.x + other.x, this.y + other.y);
    }
}



class RenderingDataHandler {
    static readonly tokenRD: Record<string, (context: CanvasRenderingContext2D, token: Token) => renderingData> = {
        word: (context, token) => RenderingDataHandler.getTextRD(context, token.content as string),
    };

    static getTextRD(context: CanvasRenderingContext2D, text: string): renderingData {
        const metrics = context.measureText(text);
        const width = metrics.width;
        const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        const position = new vec2d(width, 0);
        return { width, height, position };
    }

    static getLineRD(context: CanvasRenderingContext2D, tokens: Token[]): renderingData {
        let totalWidth = 0;
        let maxHeight = 0;

        for (const token of tokens) {
            const size = RenderingDataHandler.getTextRD(context, token.content as string);
            totalWidth += size.width;
            maxHeight = Math.max(maxHeight, size.height);
        }

        return { width: totalWidth, height: maxHeight, position: new vec2d(totalWidth, 0) };
    }

    static GetTokenRD(context: CanvasRenderingContext2D, token: Token): renderingData {
        if (!RenderingDataHandler.tokenRD[token.type]) {
            console.warn(`No rendering data function found for token type: ${token.type}`);
            return { width: 0, height: 0, position: new vec2d(0, 0) };
        }

        return RenderingDataHandler.tokenRD[token.type]!(context, token);
    }
}

export default class Renderer {
    private readonly tokenRenderers: Record<string, TokenRenderer> = {
        word: (token, canvas, context, RD) => this.renderTextToken(token, canvas, context, RD),
    };

    renderToken(token: Token, parent: HTMLCanvasElement, context: CanvasRenderingContext2D, RD: renderingData): void {
        if (!this.tokenRenderers[token.type]) {
            console.warn(`No renderer found for token type: ${token.type}`);
            return;
        }

        this.tokenRenderers[token.type]!(token, parent, context, RD);
    }


    private renderTextToken(token: Token, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, RD: renderingData): void {
        context.fillStyle = "black";
        context.fillText(token.content as string, RD.position.x, RD.position.y);
    }

    private renderLine(lineTokens: Token[], canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, position: vec2d): renderingData {
        let RD = RenderingDataHandler.getLineRD(context, lineTokens);
        let currentPosition = position;

        for (const token of lineTokens) {
            const tokenRD = RenderingDataHandler.GetTokenRD(context, token);
            tokenRD.position = currentPosition;
            currentPosition = currentPosition.add(tokenRD.position);

            this.renderToken(token, canvas, context, RD)
        }

        return RD;
    }

    render(lines: Token[][], canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
        let position: vec2d = new vec2d(0, 0);
        for (const lineTokens of lines) {
            const lineRD = this.renderLine(lineTokens, canvas, context, position);
            position = position.add(new vec2d(0, lineRD.height));
        }
    }
}
