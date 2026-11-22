import type { TokenRenderer } from "./types";
import TOKENS from "./token-handlers";
import { TokenLayoutCalculator } from "./layout-calculator";
import { Vec2D, Bounds } from "../utils";
import defaultRenderConfig from "./config";
import { Token } from "../tokenizer";

export default class Renderer {
    private readonly tokenRenderers: Record<string, TokenRenderer> = {
        word: (token, context, position, scale) => TOKENS.Text.Render.bind(this)(token, context, position, scale),
        operator: (token, context, position, scale) => TOKENS.Text.Render.bind(this)(token, context, position, scale),
        variable: (token, context, position, scale) =>
            TOKENS.Variable.Render.bind(this)(token, context, position, scale),
        exponent: (token, context, position, scale) =>
            TOKENS.Exponent.Render.bind(this)(token, context, position, scale),
        expression: (token, context, position, scale) =>
            TOKENS.Expression.Render.bind(this)(token, context, position, scale),
        fraction: (token, context, position, scale) =>
            TOKENS.Fraction.Render.bind(this)(token, context, position, scale),
        square_root: (token, context, position, scale) =>
            TOKENS.SquareRoot.Render.bind(this)(token, context, position, scale),
        empty: (token, context, position, scale) => TOKENS.Empty.Render.bind(this)(token, context, position, scale),
    };
    private readonly layoutCalculator: TokenLayoutCalculator;

    constructor() {
        this.layoutCalculator = new TokenLayoutCalculator();
    }

    RenderToken(token: Token, context: CanvasRenderingContext2D, position: Vec2D, scale: number = 1): void {
        if (!this.tokenRenderers[token.type]) {
            console.warn(`No renderer found for token type: ${token.type}`);
        } else {
            this.tokenRenderers[token.type]!(token, context, position, scale);
        }

        if (!defaultRenderConfig.debug) return;

        context.strokeStyle = "#FF0000";
        context.strokeRect(position.x, position.y - token.bounds.overBaseline, token.bounds.width, token.bounds.height);
        context.strokeStyle = "#00FF00";
        context.beginPath();
        context.moveTo(position.x, position.y);
        context.lineTo(position.x + token.bounds.width, position.y);
        context.stroke();
    }

    private RenderLine(lineTokens: Token[], context: CanvasRenderingContext2D, lineBounds: Bounds): void {
        let tokenPosition = new Vec2D(0, lineBounds.baseLine);

        for (const token of lineTokens) {
            this.RenderToken(token, context, tokenPosition);

            tokenPosition.x += token.bounds.width + defaultRenderConfig.tokenSpacing;
        }
    }

    Render(lines: Token[][], canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
        context.clearRect(0, 0, canvas.width, canvas.height);

        let lineBounds: Bounds[] = [];
        let linePosition = new Vec2D(0, 0);

        for (const lineTokens of lines) {
            lineBounds.push(this.layoutCalculator.EvaluateTokenBounds(context, lineTokens));
        }

        for (let i = 0; i < lines.length; i++) {
            const lineTokens = lines[i];

            lineBounds[i].baseLine = linePosition.y + lineBounds[i].overBaseline;
            this.RenderLine(lineTokens, context, lineBounds[i]);

            linePosition.y += lineBounds[i].height + defaultRenderConfig.lineSpacing;
        }
    }
}
