import Editor from "./editor";
import Tokenizer from "./tokenizer";
import Renderer from "./rendering/renderer";

class App {
    private editor: Editor;
    private tokenizer: Tokenizer;
    private renderer: Renderer;

    private noteDocumentElement: HTMLElement | null = null;
    private noteCanvas: HTMLCanvasElement | null = null;
    private noteContext: CanvasRenderingContext2D | null = null;

    constructor() {
        this.editor = new Editor((content) => this.HandleEditorSave(content));
        this.tokenizer = new Tokenizer();
        this.renderer = new Renderer();
    }

    ResizeCanvas() {
        if (this.noteCanvas == null) return;
        this.noteCanvas.width = this.noteDocumentElement?.clientWidth! - 1;
        this.noteCanvas.height = this.noteDocumentElement?.clientHeight! - 1;
        this.noteContext!.textBaseline = "middle";
    }

    async Initialize() {
        this.noteDocumentElement = document.querySelector(".note-document");
        this.noteCanvas = document.querySelector("#note-canvas");

        this.noteContext = this.noteCanvas?.getContext("2d") || null;

        await document.fonts.load(`30px "Latin Modern"`);

        this.ResizeCanvas();
        window.addEventListener("resize", this.ResizeCanvas.bind(this));

        this.editor.Initialize();
    }

    private HandleEditorSave(content: string): void {
        const tokenizedContent = this.tokenizer.Tokenize(content);
        this.renderer.Render(tokenizedContent, this.noteCanvas!, this.noteContext!);
    }
}

const app = new App();
app.Initialize();
