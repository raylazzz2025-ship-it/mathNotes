import TOKENS from "./token-handlers";
import { Bounds } from "../utils";
import { Token } from "../tokenizer";
import defaultRenderConfig from "./config";

export class TokenLayoutCalculator {
    readonly tokenBounds: Record<string, (context: CanvasRenderingContext2D, token: Token, scale: number) => void> = {
        word: (context, token, scale) => TOKENS.Text.Evaluate.bind(this)(context, token, scale),
        operator: (context, token, scale) => TOKENS.Text.Evaluate.bind(this)(context, token, scale),
        empty: (context, token, scale) => TOKENS.Text.Evaluate.bind(this)(context, token, scale),

        variable: (context, token, scale) => TOKENS.Variable.Evaluate.bind(this)(context, token, scale),
        exponent: (context, token, scale) => TOKENS.Exponent.Evaluate.bind(this)(context, token, scale),
        expression: (context, token, scale) => TOKENS.Expression.Evaluate.bind(this)(context, token, scale),
        fraction: (context, token, scale) => TOKENS.Fraction.Evaluate.bind(this)(context, token, scale),
        square_root: (context, token, scale) => TOKENS.SquareRoot.Evaluate.bind(this)(context, token, scale),
    };

    constructor() {}

    EvaluateSingleTokenBounds(context: CanvasRenderingContext2D, token: Token, scale = 1): void {
        if (!this.tokenBounds[token.type]) {
            console.warn(`No layout calculator found for token type: ${token.type}`);
            return;
        }

        this.tokenBounds[token.type]!(context, token, scale);
    }

    EvaluateTokenBounds(context: CanvasRenderingContext2D, tokens: Token[], scale = 1): Bounds {
        let bounds = Bounds.Zero();

        for (const token of tokens) {
            this.EvaluateSingleTokenBounds(context, token, scale);

            bounds.width += token.bounds.width + defaultRenderConfig.tokenSpacing;

            if (token.bounds.underBaseline > bounds.underBaseline) {
                bounds.underBaseline = token.bounds.underBaseline;
            }
            if (token.bounds.overBaseline > bounds.overBaseline) {
                bounds.overBaseline = token.bounds.overBaseline;
            }
        }

        bounds.width -= defaultRenderConfig.tokenSpacing; // Remove the last token spacing

        return bounds;
    }
}
