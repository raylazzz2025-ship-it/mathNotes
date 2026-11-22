import { Bounds } from "./utils";

export class Token {
    public type: string;
    public content: string | Token[];
    public tag: string;
    public bounds: Bounds;

    constructor(type: string, content: string | Token[], tag: string = "") {
        this.type = type;
        this.content = content;
        this.tag = tag;
        this.bounds = Bounds.Zero();
    }

    Clone(): Token {
        if (typeof this.content === "string") {
            return new Token(this.type, this.content, this.tag);
        } else {
            const clonedContent = this.content.map((token) => token.Clone());
            return new Token(this.type, clonedContent, this.tag);
        }
    }

    Reset(): void {
        this.content = "";
        this.type = "word";
        this.tag = "";
    }
}

export class Operation {
    public priority: number;
    public args: number[];
    public renderType: string;
    public operator: string;

    constructor(priority: number, args: number[], renderType: string, operator: string) {
        this.priority = priority;
        this.args = args;
        this.renderType = renderType;
        this.operator = operator;
    }
}

export default class Tokenizer {
    private readonly separators: string[] = [" "];
    private readonly operators: string[] = [
        "+",
        "-",
        "*",
        "/",
        "=",
        "==",
        "!=",
        "<",
        ">",
        "<=",
        ">=",
        "&&",
        "||",
        "!",
        "%",
        "^",
        "&",
        "|",
        "~",
        "<<",
        ">>",
        "_",
    ];
    private readonly bracketsCouples: { [key: string]: string } = {
        "(": ")",
        "[": "]",
        "{": "}",
    };

    private readonly bracketsOpened: string = Object.keys(this.bracketsCouples).join("");
    private readonly bracketsClosed: string = Object.values(this.bracketsCouples).join("");

    private SCO: Operation[];
    private structures: Operation[];
    private symbols: { [key: string]: string };

    constructor() {
        this.SCO = [
            new Operation(0, [-1, 1], "exponent", "^"),
            new Operation(1, [-1, 1], "fraction", "/"),
            new Operation(1, [-1, 1], "product", "*"),
            new Operation(0, [-1, 1], "variable", "_"),
        ];
        this.structures = [new Operation(0, [1], "square_root", "sqrt")];
        this.symbols = {
            alpha: "α",
            Alpha: "Α",
            beta: "β",
            Beta: "Β",
            gamma: "γ",
            Gamma: "Γ",
            delta: "δ",
            Delta: "Δ",
            theta: "θ",
            Theta: "Θ",
            lambda: "λ",
            Lambda: "Λ",
            pi: "π",
            Pi: "Π",
            sigma: "σ",
            Sigma: "Σ",
            phi: "φ",
            Phi: "Φ",
            psi: "ψ",
            Psi: "Ψ",
            omega: "ω",
            Omega: "Ω",
            infinity: "∞",
            epsilon: "ε",
        };
    }

    PushCurrentToken(token: Token, result: Token[]): void {
        if (token.content.length > 0) {
            result.push(token.Clone());
            token.Reset();
        }
    }

    SeparateTokens(content: string): Token[] {
        const result: Token[] = [];
        let currentToken = new Token("word", "");

        let bracketOpened: string = "";
        let bracketCount: number = 0;

        for (const char of content.split("")) {
            if (this.bracketsOpened.includes(char)) {
                if (bracketCount === 0) {
                    this.PushCurrentToken(currentToken, result);
                    bracketOpened = char;
                    bracketCount++;
                    continue;
                } else if (bracketOpened == char) {
                    bracketCount++;
                }
            } else if (this.bracketsClosed.includes(char)) {
                if (bracketCount > 0 && this.bracketsCouples[bracketOpened] === char) {
                    bracketCount--;

                    if (bracketCount === 0) {
                        bracketOpened = "";

                        currentToken.type = "expression";
                        currentToken.tag = char;

                        this.PushCurrentToken(currentToken, result);

                        continue;
                    }
                }
            }

            if (bracketCount === 0) {
                if (this.separators.includes(char)) {
                    this.PushCurrentToken(currentToken, result);
                    continue;
                } else if (this.operators.includes(char)) {
                    this.PushCurrentToken(currentToken, result);

                    result.push(new Token("operator", char));
                    continue;
                }
            }

            currentToken.content += char;
        }

        this.PushCurrentToken(currentToken, result);

        return result;
    }

    // Handle Single-Character-Operations
    HandleSCO(tokens: Token[]): void {
        this.HandleOperations(tokens, this.SCO, "operator", true);
    }

    HandleStructures(tokens: Token[]): void {
        this.HandleOperations(tokens, this.structures, "word");
    }

    HandleSymbols(tokens: Token[]): void {
        for (const token of tokens) {
            if (token.type === "word") {
                const key = token.content as string;
                if (this.symbols[key]) {
                    token.content = this.symbols[key];
                }
            } else if (token.type === "expression") {
                this.HandleSymbols(token.content as Token[]);
            }
        }
    }

    private HandleOperations(tokens: Token[], operations: Operation[], tokenType: string, prioritize = false): void {
        const priorities: (number | undefined)[] = prioritize
            ? [...new Set(operations.map((operation) => operation.priority))].sort((a, b) => a - b)
            : [undefined];

        for (const priority of priorities) {
            for (let i = 0; i < tokens.length; i++) {
                const t = tokens[i];

                if (t.type !== tokenType) continue;

                for (const operation of operations) {
                    if ((priority !== undefined && operation.priority !== priority) || operation.operator !== t.content)
                        continue;

                    const args: Token[] = [];
                    for (const offset of operation.args) {
                        const argumentIndex = i + offset;
                        if (argumentIndex < 0 || argumentIndex >= tokens.length) {
                            args.push(new Token("empty", ""));
                            continue;
                        }

                        const argumentToken = tokens.splice(argumentIndex, 1)[0];
                        if (offset < 0) i--;
                        args.push(argumentToken);
                    }

                    tokens.splice(i, 1, new Token(operation.renderType, args));

                    break;
                }
            }
        }
    }

    InterpretTokens(tokens: Token[]): Token[] {
        this.HandleSymbols(tokens);
        this.HandleStructures(tokens);
        this.HandleSCO(tokens);

        return tokens;
    }

    HandleExpressions(tokens: Token[]): Token[] {
        const result: Token[] = [];

        for (const token of tokens) {
            if (token.type === "expression") {
                const innerContent = token.content as string;
                const innerTokens = this.SeparateTokens(innerContent);
                const processedInnerTokens = this.HandleExpressions(innerTokens);

                token.content = processedInnerTokens;

                if (token.content.length === 0) {
                    token.type = "empty";
                    token.content = "";
                }
            }

            result.push(token);
        }

        return this.InterpretTokens(result);
    }

    Tokenize(content: string): Token[][] {
        let lines = content.split("\n");
        let separatedLines: Token[][] = [];

        for (const line of lines) {
            if (line.trim() === "") continue;

            let separatedTokens = this.SeparateTokens(line);
            separatedTokens = this.HandleExpressions(separatedTokens);
            separatedLines.push(separatedTokens);
        }

        console.log(separatedLines);

        return separatedLines;
    }
}
