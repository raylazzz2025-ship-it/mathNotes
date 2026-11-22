import { Token } from "../tokenizer";
import type { TokenHandler } from "./types";
import defaultRenderConfig from "./config";
import { Vec2D, Bounds } from "../utils";
import { CanvasDrawer } from "./canvas-drawer";

const TOKENS: Record<string, TokenHandler> = {
    Text: {
        numericData: {},
        stringData: {},
        Evaluate: function (context, token, scale) {
            context.font = `${defaultRenderConfig.fontSize * scale}px "Latin Modern"`;
            let content = (token.content as string) || " ";

            const metrics = context.measureText(content);
            token.bounds.width = metrics.width;
            token.bounds.overBaseline = metrics.fontBoundingBoxAscent;
            token.bounds.underBaseline = metrics.fontBoundingBoxDescent;
        },
        Render: function (token, context, position, scale) {
            CanvasDrawer.DrawText(
                context,
                token.content as string,
                position,
                "#000000",
                defaultRenderConfig.fontSize * scale,
            );
        },
    },
    Variable: {
        numericData: { resizingFactor: 0.5 },
        stringData: {},
        Evaluate: function (context, token, scale) {
            const base = token.content[0] as Token;
            const name = token.content[1] as Token;

            this.EvaluateSingleTokenBounds(context, base, scale);
            this.EvaluateSingleTokenBounds(context, name, TOKENS.Variable.numericData.resizingFactor * scale);

            token.bounds = new Bounds(
                base.bounds.width + name.bounds.width,
                base.bounds.overBaseline,
                base.bounds.underBaseline + name.bounds.underBaseline,
                0,
            );
        },
        Render: function RenderVariableToken(token, context, position, scale) {
            const base = token.content[0] as Token;
            const name = token.content[1] as Token;

            const basePosition = position.Copy();
            const namePosition = position.Add(new Vec2D(base.bounds.width, base.bounds.underBaseline));

            this.RenderToken(base, context, basePosition, scale);
            this.RenderToken(name, context, namePosition, scale * TOKENS.Variable.numericData.resizingFactor);
        },
    },
    Exponent: {
        numericData: { resizingFactor: 0.8 },
        stringData: {},
        Evaluate: function (context, token, scale) {
            const base = token.content[0] as Token;
            const exponent = token.content[1] as Token;

            this.EvaluateSingleTokenBounds(context, base, scale);
            this.EvaluateSingleTokenBounds(context, exponent, TOKENS.Exponent.numericData.resizingFactor * scale);

            token.bounds = new Bounds(
                base.bounds.width + exponent.bounds.width,
                exponent.bounds.height,
                base.bounds.underBaseline,
                0,
            );
        },
        Render: function RenderExponentToken(token, context, position, scale) {
            const base = token.content[0] as Token;
            const exponent = token.content[1] as Token;

            const basePosition = position.Copy();
            const exponentPosition = position.Add(new Vec2D(base.bounds.width, -exponent.bounds.underBaseline));

            this.RenderToken(base, context, basePosition, scale);
            this.RenderToken(exponent, context, exponentPosition, scale * TOKENS.Exponent.numericData.resizingFactor);
        },
    },
    Fraction: {
        numericData: {
            barWidthOffset: 0.3 * defaultRenderConfig.fontSize,
            lineWidthFactor: 0.05 * defaultRenderConfig.fontSize,
            padding: 0.15 * defaultRenderConfig.fontSize,
        },
        stringData: {},
        Evaluate: function (context, token, scale) {
            const numerator = token.content[0] as Token;
            const denominator = token.content[1] as Token;
            const barWidthOffset = TOKENS.Fraction.numericData.barWidthOffset * scale;

            this.EvaluateSingleTokenBounds(context, numerator, scale);
            this.EvaluateSingleTokenBounds(context, denominator, scale);

            const width = Math.max(numerator.bounds.width, denominator.bounds.width) + barWidthOffset;
            const overBaseline = numerator.bounds.height + TOKENS.Fraction.numericData.padding * scale;
            const underBaseline = denominator.bounds.height + TOKENS.Fraction.numericData.padding * scale;

            token.bounds = new Bounds(width, overBaseline, underBaseline, 0);
        },
        Render: function RenderFractionToken(token, context, position, scale) {
            const numerator = token.content[0] as Token;
            const denominator = token.content[1] as Token;

            const numeratorPosition = position.Add(
                new Vec2D(
                    (token.bounds.width - numerator.bounds.width) / 2,
                    -numerator.bounds.underBaseline - TOKENS.Fraction.numericData.padding * scale,
                ),
            );
            const denominatorPosition = position.Add(
                new Vec2D(
                    (token.bounds.width - denominator.bounds.width) / 2,
                    denominator.bounds.overBaseline + TOKENS.Fraction.numericData.padding * scale,
                ),
            );

            this.RenderToken(numerator, context, numeratorPosition, scale);
            this.RenderToken(denominator, context, denominatorPosition, scale);

            CanvasDrawer.DrawLine(
                context,
                position,
                position.Add(new Vec2D(token.bounds.width, 0)),
                "#000000",
                TOKENS.Fraction.numericData.lineWidthFactor * scale,
            );
        },
    },
    Expression: {
        numericData: {
            bracketWidthFactor: 1 * defaultRenderConfig.fontSize,
        },
        stringData: {
            bracketSymbol1: "M 58 0 A 61 101 0 0 0 58 186 L 48 186 A 75 101 0 0 1 48 0",
            bracketSymbol2: "M 36 0 L 0 0 L 0 184 L 36 184 L 36 176 L 8 176 L 8 8 L 36 8 L 36 0",
        },
        Evaluate: function (context, token, scale) {
            const bounds = this.EvaluateTokenBounds(context, token.content as Token[], scale);

            if (token.tag === ")" || token.tag === "]") {
                bounds.width += TOKENS.Expression.numericData.bracketWidthFactor * scale * 2;
            }
            token.bounds = bounds;
        },
        Render: function (token, context, position, scale): void {
            let tokenPosition = position.Copy();

            for (const subToken of token.content as Token[]) {
                this.RenderToken(subToken, context, tokenPosition, scale);
                tokenPosition.x += subToken.bounds.width + defaultRenderConfig.tokenSpacing;
            }
        },
    },
    SquareRoot: {
        numericData: {
            rootSymbolWidthFactor: 0.7 * defaultRenderConfig.fontSize,
            paddingTop: 0.15 * defaultRenderConfig.fontSize,
            lineWidthFactor: 0.05 * defaultRenderConfig.fontSize,
        },
        stringData: {},
        Evaluate: function (context: CanvasRenderingContext2D, token: Token, scale: number) {
            this.EvaluateSingleTokenBounds(context, token.content[0] as Token, scale);
            const rootContent = token.content[0] as Token;

            const rootSymbolWidth = TOKENS.SquareRoot.numericData.rootSymbolWidthFactor * scale;
            const width = rootSymbolWidth + rootContent.bounds.width;
            const overBaseline = rootContent.bounds.overBaseline + TOKENS.SquareRoot.numericData.paddingTop;
            const underBaseline = rootContent.bounds.underBaseline;

            token.bounds = new Bounds(width, overBaseline, underBaseline, 0);
        },
        Render: function RenderSquareRootToken(
            token: Token,
            context: CanvasRenderingContext2D,
            position: Vec2D,
            scale: number,
        ) {
            const symbolPath = "M0 33 L7 27 L12.5 47 L13 47 L30 0 L32 0 L13 54 L11 54 L4.5 31 L0 33";
            const originalSize = new Vec2D(32, 54);
            const symbolSize = new Vec2D(
                TOKENS.SquareRoot.numericData.rootSymbolWidthFactor * scale,
                token.bounds.height,
            );

            const rootContent = token.content[0] as Token;
            const rootContentPosition = position.Add(new Vec2D(symbolSize.x, 0));

            CanvasDrawer.DrawSVG(
                context,
                symbolPath,
                originalSize,
                position.Add(new Vec2D(0, -token.bounds.overBaseline)),
                symbolSize,
            );
            this.RenderToken(rootContent, context, rootContentPosition, scale);

            CanvasDrawer.DrawLine(
                context,
                position.Add(new Vec2D(symbolSize.x - 1, -token.bounds.overBaseline)),
                position.Add(new Vec2D(token.bounds.width, -token.bounds.overBaseline)),
                "#000000",
                TOKENS.SquareRoot.numericData.lineWidthFactor * scale,
            );
        },
    },
    Empty: {
        numericData: {
            lineWidthFactor: 0.05 * defaultRenderConfig.fontSize,
        },
        stringData: {},
        Evaluate: function (context, token, scale) {
            token.bounds = new Bounds(0, 0, 0, 0);
        },
        Render: function (token, context, position, scale): void {
            // return a dashed square to indicate an empty token
            CanvasDrawer.DrawDashedRect(
                context,
                position.Add(new Vec2D(0, -token.bounds.overBaseline + 2 * scale)),
                new Vec2D(token.bounds.width, token.bounds.height - 4 * scale),
                "#7e7e7e",
                TOKENS.Empty.numericData.lineWidthFactor * scale,
                [5 * scale, 5 * scale],
            );
        },
    },
};

export default TOKENS;
