import Renderer from "./renderer";
import { TokenLayoutCalculator } from "./layout-calculator";
import { Token } from "../tokenizer";
import { Vec2D } from "../utils";

export interface RenderConfig {
    readonly fontSize: number;
    readonly tokenSpacing: number;
    readonly lineSpacing: number;
    readonly debug: boolean;
}

export interface TokenHandler {
    numericData: { [key: string]: number };
    stringData: { [key: string]: string };

    Evaluate: (this: TokenLayoutCalculator, context: CanvasRenderingContext2D, token: Token, scale: number) => void;
    Render: (this: Renderer, token: Token, context: CanvasRenderingContext2D, position: Vec2D, scale: number) => void;
}

export type TokenRenderer = (token: Token, context: CanvasRenderingContext2D, position: Vec2D, scale: number) => void;
