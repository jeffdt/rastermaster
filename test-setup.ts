import { Window } from 'happy-dom';

// happy-dom 20.x bug: querySelectorAll internally calls `new this.window.SyntaxError`
// but the Window class doesn't expose SyntaxError. Patch the prototype so every
// Window instance (including ones created in individual test files) gets it.
;(Window.prototype as any).SyntaxError = globalThis.SyntaxError;

// Create a happy-dom window and set up global browser APIs
const window = new Window();
const document = window.document;

// Make browser APIs available globally
global.window = window as any;
global.document = document as any;
global.navigator = window.navigator as any;
global.getComputedStyle = window.getComputedStyle.bind(window) as any;
global.HTMLElement = window.HTMLElement as any;
global.Element = window.Element as any;
global.localStorage = window.localStorage as any;
global.sessionStorage = window.sessionStorage as any;
