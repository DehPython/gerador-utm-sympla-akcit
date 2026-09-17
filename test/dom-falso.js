// DOM mínimo para carregar src/app.js fora do navegador. Não imita o HTML de
// verdade: lê os ids do index.html e responde a eles, o bastante para provar
// que o módulo carrega, registra os ouvintes e reage a um clique.
import { readFileSync } from 'node:fs';

class Elemento {
  constructor(tag = 'div') {
    this.tagName = tag;
    this.filhos = [];
    this.ouvintes = new Map();
    this.classes = new Set();
    this.atributos = {};
    this.value = '';
    this.textContent = '';
    this.hidden = false;
    this.checked = false;
    this.indeterminate = false;
    this.disabled = false;
    this.classList = {
      add: (c) => this.classes.add(c),
      remove: (c) => this.classes.delete(c),
      toggle: (c, on) => (on ? this.classes.add(c) : this.classes.delete(c)),
      contains: (c) => this.classes.has(c),
    };
  }

  set className(v) { this.classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this.classes].join(' '); }
  get dataset() { return (this._dataset ??= {}); }

  append(...nos) {
    this.filhos.push(...nos);
    // append também recebe texto puro, que não aceita propriedade.
    for (const n of nos) if (n instanceof Elemento) n.pai = this;
  }
  remove() { if (this.pai) this.pai.filhos = this.pai.filhos.filter((f) => f !== this); }
  select() { globalThis.document.__valorSelecionado = this.value; }
  setSelectionRange(inicio, fim) { globalThis.document.__intervalo = [inicio, fim]; }
  get style() { return (this._style ??= {}); }
  replaceChildren(...nos) { this.filhos = nos; }
  setAttribute(k, v) { this.atributos[k] = v; }
  removeAttribute(k) { delete this.atributos[k]; }
  getAttribute(k) { return this.atributos[k] ?? null; }
  focus() {}
  addEventListener(tipo, fn) {
    if (!this.ouvintes.has(tipo)) this.ouvintes.set(tipo, []);
    this.ouvintes.get(tipo).push(fn);
  }
  disparar(tipo) {
    for (const fn of this.ouvintes.get(tipo) ?? []) fn({ currentTarget: this, target: this });
  }
  // Procura em profundidade por texto, para as asserções dos testes
  texto() {
    return [this.textContent, ...this.filhos.map((f) => (f.texto ? f.texto() : String(f)))].join(' ');
  }
}

export function montarDom(html = 'index.html') {
  const fonte = readFileSync(html, 'utf8');
  const porId = new Map();
  for (const tag of fonte.matchAll(/<(\w+)([^>]*\bid="([^"]+)"[^>]*)>/g)) {
    const elemento = new Elemento(tag[1]);
    const atributos = tag[2];

    // Copia os atributos escritos no HTML, para o teste enxergar o mesmo que o
    // navegador enxerga (role, aria-*, type, placeholder).
    for (const attr of atributos.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) {
      elemento.atributos[attr[1]] = attr[2];
    }
    elemento.hidden = /\bhidden\b/.test(atributos);
    if (elemento.atributos.value) elemento.value = elemento.atributos.value;

    porId.set(tag[3], elemento);
  }

  globalThis.document = {
    getElementById: (id) => porId.get(id) ?? null,
    createElement: (tag) => new Elemento(tag),
    body: new Elemento('body'),
    // O teste decide se o execCommand "funcionou", como o navegador decidiria.
    execCommand(comando) {
      globalThis.document.__ultimoComando = comando;
      return globalThis.document.__execCommandResultado ?? false;
    },
  };
  globalThis.window = { scrollY: 0, scrollTo() {} };
  // navigator já existe no Node e só tem getter: define a propriedade em vez de atribuir
  Object.defineProperty(globalThis, 'navigator', {
    value: { clipboard: { writeText: async () => {} } },
    configurable: true,
  });
  globalThis.setTimeout = () => 0;

  return porId;
}
