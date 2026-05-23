export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0 };
    this.mouseDown = false;
    this.wheelDelta = 0;
    this.justPressed = new Set();
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);
  }

  init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('contextmenu', this._onContextMenu);
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('contextmenu', this._onContextMenu);
  }

  _onKeyDown(e) {
    const key = e.key.toLowerCase();
    if (!this.keys[key]) this.justPressed.add(key);
    this.keys[key] = true;
  }

  _onKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
  }

  _onMouseMove(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  _onMouseDown(e) { this.mouseDown = true; }
  _onMouseUp(e) { this.mouseDown = false; }

  _onWheel(e) {
    e.preventDefault();
    this.wheelDelta += e.deltaY > 0 ? -1 : 1;
  }

  _onContextMenu(e) { e.preventDefault(); }

  isDown(key) { return !!this.keys[key.toLowerCase()]; }
  wasJustPressed(key) { return this.justPressed.has(key.toLowerCase()); }

  consumeWheel() {
    const v = this.wheelDelta;
    this.wheelDelta = 0;
    return v;
  }

  clearFrame() { this.justPressed.clear(); }
}
