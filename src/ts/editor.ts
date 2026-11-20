import * as monaco from "monaco-editor/editor/editor.api.js";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";

export default class Editor {
    private editor: monaco.editor.IStandaloneCodeEditor | null = null;
    private readonly onEdit: (content: string) => void;

    constructor(onEdit: (content: string) => void) {
        this.onEdit = onEdit;
    }

    initialize(): void {
        if (this.editor) {
            return;
        }

        const editorContainer = this.getRequiredElement("#monaco-editor");
        const cursorStatus = this.getRequiredElement("#cursor-status");
        const saveStatus = this.getRequiredElement("#save-status-label");
        const saveIndicator = this.getRequiredElement("#save-indicator");
        const fileUnsaved = this.getRequiredElement("#file-unsaved");

        this.configureWorker();
        this.configureTheme();
        this.configureLanguage();

        this.editor = this.createEditor(editorContainer);
        this.bindEvents(this.editor, cursorStatus, saveStatus, saveIndicator, fileUnsaved);
        this.disposeOnHotReload();

        this.onEdit(this.editor.getValue());
    }

    private getRequiredElement(selector: string): HTMLElement {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) {
            throw new Error(`Élément requis pour l'éditeur introuvable : ${selector}`);
        }

        return element;
    }

    private configureWorker(): void {
        globalThis.MonacoEnvironment = {
            getWorker: () => new EditorWorker(),
        };
    }

    private configureTheme(): void {
        monaco.editor.defineTheme("mathnotes-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
                { token: "comment", foreground: "#7F8C81", fontStyle: "italic" },
                { token: "number", foreground: "#A6D189" },
                { token: "string", foreground: "#E5C07B" },
                { token: "operator", foreground: "#CBA6F7" },
                { token: "keyword", foreground: "#C4A7E7", fontStyle: "bold" },
                { token: "identifier", foreground: "#C9D1E2" },
                { token: "brackets", foreground: "#E5C07B" },
                { token: "", foreground: "#C9D1E2" },
            ],
            colors: {
                "editor.background": "#171922",
                "editorGutter.background": "#171922",
                "editorLineNumber.foreground": "#555967",
                "editorLineNumber.activeForeground": "#a7a9b5",
                "editor.lineHighlightBackground": "#20222d",
                "editor.selectionBackground": "#514a8c80",
                "editorCursor.foreground": "#a69aff",
                "editorIndentGuide.background1": "#292b36",
                "editorIndentGuide.activeBackground1": "#474252",
                "editorWhitespace.foreground": "#323440",
            },
        });
    }

    private configureLanguage(): void {
        const languageId = "mathnotes";

        monaco.languages.register({
            id: languageId,
            extensions: [".mn"],
            aliases: ["MathNotes"],
        });

        monaco.languages.setLanguageConfiguration(languageId, {
            brackets: [
                ["(", ")"],
                ["[", "]"],
                ["{", "}"],
            ],
            autoClosingPairs: [
                { open: "(", close: ")" },
                { open: "[", close: "]" },
                { open: "{", close: "}" },
                { open: "\"", close: "\"", notIn: ["string", "comment"] },
                { open: "'", close: "'", notIn: ["string", "comment"] },
            ],
            surroundingPairs: [
                { open: "(", close: ")" },
                { open: "[", close: "]" },
                { open: "{", close: "}" },
                { open: "\"", close: "\"" },
                { open: "'", close: "'" },
            ],
        });

        monaco.languages.setMonarchTokensProvider(languageId, {
            keywords: ["matrix", "vector", "transform"],
            tokenizer: {
                root: [
                    [/#.*$/, "comment"],
                    [/\b\d+(?:\.\d+)?\b/, "number"],
                    [/"/, { token: "string", next: "@doubleQuotedString" }],
                    [/'/, { token: "string", next: "@singleQuotedString" }],
                    [/[+\-*\/=]/, "operator"],
                    [/[{}()\[\]]/, "brackets"],
                    [/[a-zA-Z_]\w*/, {
                        cases: {
                            "@keywords": "keyword",
                            "@default": "identifier",
                        },
                    }],
                ],
                doubleQuotedString: [
                    [/[^\\"]+/, "string"],
                    [/\\./, "string.escape"],
                    [/"/, { token: "string", next: "@pop" }],
                ],
                singleQuotedString: [
                    [/[^\\']+/, "string"],
                    [/\\./, "string.escape"],
                    [/'/, { token: "string", next: "@pop" }],
                ],
            },
        });
    }

    private createEditor(container: HTMLElement): monaco.editor.IStandaloneCodeEditor {
        return monaco.editor.create(container, {
            ariaLabel: "Éditeur de code MathNotes",
            automaticLayout: true,
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            autoSurround: "languageDefined",
            bracketPairColorization: { enabled: true },
            fontFamily: '"DM Mono", monospace',
            fontSize: 13,
            insertSpaces: true,
            language: "mathnotes",
            lineHeight: 23,
            minimap: { enabled: false },
            padding: { top: 18, bottom: 18 },
            renderLineHighlight: "line",
            scrollBeyondLastLine: false,
            tabSize: 4,
            theme: "mathnotes-dark",
            value: [
                "E_photon = h gamma = {h c} / lambda = h c sigma",
                "E(e^-) = E_cinétique + E_potentiel = 1/2 m v^2 + {-e^2}/{4 pi epsilon_0 r} = - {m e^4}/{8 epsilon_0^2 h^2} 1/n^2"
            ].join("\n"),
            wordWrap: "on",
        });
    }

    private bindEvents(
        editor: monaco.editor.IStandaloneCodeEditor,
        cursorStatus: HTMLElement,
        saveStatus: HTMLElement,
        saveIndicator: HTMLElement,
        fileUnsaved: HTMLElement,
    ): void {
        editor.onDidChangeCursorPosition(({ position }) => {
            cursorStatus.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
        });

        editor.onDidChangeModelContent(() => {
            this.onEdit(editor.getValue());
            saveStatus.textContent = "Modifié";
            saveIndicator.classList.add("is-dirty");
            fileUnsaved.classList.add("is-visible");
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            saveStatus.textContent = "Enregistré";
            saveIndicator.classList.remove("is-dirty");
            fileUnsaved.classList.remove("is-visible");
        });
    }

    private disposeOnHotReload(): void {
        if (import.meta.hot) {
            import.meta.hot.dispose(() => {
                this.editor?.dispose();
                this.editor = null;
            });
        }
    }
}
