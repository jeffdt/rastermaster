import { Window } from 'happy-dom';

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
