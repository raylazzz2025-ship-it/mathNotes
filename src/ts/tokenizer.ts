export class Token {
    public type: string;
    public content: string | Token[];
    public tag: string;

    constructor(type: string, content: string | Token[], tag: string = "") {
        this.type = type;
        this.content = content;
        this.tag = tag;
    }

    clone(): Token {
        if (typeof this.content === "string") {
            return new Token(this.type, this.content, this.tag);
        } else {
            const clonedContent = this.content.map((token) => token.clone());
            return new Token(this.type, clonedContent, this.tag);
        }
    }

    reset(): void {
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
    private readonly operators: string[] = ["+", "-", "*", "/", "=", "==", "!=", "<", ">", "<=", ">=", "&&", "||", "!", "%", "^", "&", "|", "~", "<<", ">>", "_"];
    private readonly parenthesesCouples: { [key: string]: string } = {
        "(": ")",
        "[": "]",
        "{": "}",
    };

    private readonly parenthesesOpened: string = Object.keys(this.parenthesesCouples).join("");
    private readonly parenthesesClosed: string = Object.values(this.parenthesesCouples).join("");

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
        this.structures = [
            new Operation(0, [1], "square_root", "sqrt"),
        ]
        this.symbols = {
            "alpha": "α",
            "Alpha": "Α",
            "beta": "β",
            "Beta": "Β",
            "gamma": "γ",
            "Gamma": "Γ",
            "delta": "δ",
            "Delta": "Δ",
            "theta": "θ",
            "Theta": "Θ",
            "lambda": "λ",
            "Lambda": "Λ",
            "pi": "π",
            "Pi": "Π",
            "sigma": "σ",
            "Sigma": "Σ",
            "phi": "φ",
            "Phi": "Φ",
            "psi": "ψ",
            "Psi": "Ψ",
            "omega": "ω",
            "Omega": "Ω",
            "infinity": "∞",
            "epsilon": "ε",
        }
    }

    pushCurrentToken(token: Token, result: Token[]): void {
        if (token.content.length > 0) {
            result.push(token.clone());
            token.reset();
        }
    }

    separateTokens(content: string, parented = false): Token[] {
        const result: Token[] = [];
        let currentToken = new Token("word", "");

        let parenthesisOpened: string = "";
        let parenthesisCount: number = 0;

        const firstChar = content[0];
        const lastChar = content[content.length - 1];

        if (parented) {
            content = content.slice(1, -1)
            if (firstChar !== "{") result.push(new Token("word", firstChar));
        }


        for (const char of content.split("")) {
            if (this.parenthesesOpened.includes(char)) {
                if (parenthesisCount === 0) {
                    this.pushCurrentToken(currentToken, result);
                    parenthesisOpened = char;
                    parenthesisCount++;

                    currentToken.content += char;
                    continue;
                } else if (parenthesisOpened == char) {
                    parenthesisCount++;
                }
            } else if (this.parenthesesClosed.includes(char)) {
                if (parenthesisCount > 0 && this.parenthesesCouples[parenthesisOpened] === char) {
                    parenthesisCount--;

                    if (parenthesisCount === 0) {
                        parenthesisOpened = "";

                        currentToken.type = "expression";
                        currentToken.tag = "parented";
                        currentToken.content += char;

                        this.pushCurrentToken(currentToken, result);

                        continue;
                    }
                }
            }

            if (parenthesisCount === 0) {
                if (this.separators.includes(char)) {
                    this.pushCurrentToken(currentToken, result);
                    continue;
                } else if (this.operators.includes(char)) {
                    this.pushCurrentToken(currentToken, result);

                    result.push(new Token("operator", char));
                    continue;
                }
            }

            currentToken.content += char;
        }

        this.pushCurrentToken(currentToken, result);

        if (parented && lastChar !== "}") result.push(new Token("word", lastChar));

        return result;
    }

    // Handle Single-Character-Operations
    handleSCO(tokens: Token[]): void {
        this.handleOperations(tokens, this.SCO, "operator", true);
    }

    handleStructures(tokens: Token[]): void {
        this.handleOperations(tokens, this.structures, "word");
    }

    handleSymbols(tokens: Token[]): void {
        for (const token of tokens) {
            if (token.type === "word") {
                const key = token.content as string;
                if (this.symbols[key]) {
                    token.content = this.symbols[key];
                }

            } else if (token.type === "expression") {
                this.handleSymbols(token.content as Token[]);
            }
        }
    }

    private handleOperations(tokens: Token[], operations: Operation[], tokenType: string, prioritize = false): void {
        const priorities: (number | undefined)[] = prioritize
            ? [...new Set(operations.map((operation) => operation.priority))].sort((a, b) => a - b)
            : [undefined];

        for (const priority of priorities) {
            for (let i = 0; i < tokens.length; i++) {
                const t = tokens[i];

                if (t.type !== tokenType) continue;

                for (const operation of operations) {
                    if ((priority !== undefined && operation.priority !== priority) || operation.operator !== t.content) continue;

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

    interpretTokens(tokens: Token[]): Token[] {
        this.handleSymbols(tokens);
        this.handleSCO(tokens);
        this.handleStructures(tokens);

        return tokens;
    }

    handleExpressions(tokens: Token[]): Token[] {
        const result: Token[] = [];

        for (const token of tokens) {
            if (token.type === "expression") {
                const innerContent = token.content as string;
                const innerTokens = this.separateTokens(innerContent, token.tag === "parented");
                const processedInnerTokens = this.handleExpressions(innerTokens);

                token.content = processedInnerTokens;
            }

            result.push(token);
        }

        return this.interpretTokens(result);
    }

    tokenize(content: string): Token[][] {
        let lines = content.split("\n");
        let separatedLines: Token[][] = [];

        for (const line of lines) {
            if (line.trim() === "") continue;

            let separatedTokens = this.separateTokens(line);
            separatedTokens = this.handleExpressions(separatedTokens);
            separatedLines.push(separatedTokens);
        }

        return separatedLines;
    }
}