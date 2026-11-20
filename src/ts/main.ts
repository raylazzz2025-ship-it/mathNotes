import Editor from "./editor";
import Tokenizer from "./tokenizer";
import Renderer from "./renderer";


class App {
  private editor: Editor;
  private tokenizer: Tokenizer;
  private renderer: Renderer;

  private noteDocumentElement: HTMLElement | null = null;
  private noteCanvas: HTMLCanvasElement | null = null;
  private noteContext: CanvasRenderingContext2D | null = null;

  constructor() {
    this.editor = new Editor((content) => this.handleEditorSave(content));
    this.tokenizer = new Tokenizer();
    this.renderer = new Renderer();
  }

  resizeCanvas() {
    if (this.noteCanvas == null) return;
    this.noteCanvas.width = this.noteDocumentElement?.clientWidth! - 1;
    this.noteCanvas.height = this.noteDocumentElement?.clientHeight! - 1;
    this.noteContext!.font = '30px "Latin Modern"';
    this.noteContext!.textBaseline = "hanging";
  }

  async initialize() {
    this.noteDocumentElement = document.querySelector(".note-document");
    this.noteCanvas = document.querySelector("#note-canvas");

    this.noteContext = this.noteCanvas?.getContext("2d") || null;

    await document.fonts.load('30px "Latin Modern"');

    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas.bind(this));

    this.editor.initialize();
  }

  private handleEditorSave(content: string): void {
    const tokenizedContent = this.tokenizer.tokenize(content);
    this.renderer.render(tokenizedContent, this.noteCanvas!, this.noteContext!);
  }
}

const app = new App();
app.initialize();