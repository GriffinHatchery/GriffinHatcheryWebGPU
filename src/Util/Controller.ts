export class Controller {
  constructor() {
    document.addEventListener('keydown', (ev) => this.keydown(ev));
    document.addEventListener('keyup', (ev) => this.keyup(ev));
  }

  q = false;
  w = false;
  e = false;
  r = false;
  a = false;
  s = false;
  d = false;
  f = false;
  z = false;
  x = false;
  c = false;
  capsLock = false;
  up = false;
  left = false;
  right = false;
  down = false;

  public any() {
    return this.q || this.w || this.e || this.r || this.a || this.s || this.d || this.f || this.capsLock || this.up || this.left || this.right || this.down;
  }

  private keydown(ev: KeyboardEvent) {
    if (!ev.repeat) {
      let temp;

      switch (ev.key) {
        case "Down": // IE/Edge specific value
        case "ArrowDown":
          this.down = true;
          break;
        case "Up": // IE/Edge specific value
        case "ArrowUp":
          this.up = true;
          break;
        case "Left": // IE/Edge specific value
        case "ArrowLeft":
          this.left = true;
          break;
        case "Right": // IE/Edge specific value
        case "ArrowRight":
          this.right = true;
          break;
        case "q": // IE/Edge specific value
        case "Q":
          this.q = true;
          break;
        case "e": // IE/Edge specific value
        case "E":
          this.e = true;
          break;
        case "w":
        case "W":
          this.w = true;
          break;
        case "s":
        case "S":
          this.s = true;
          break;
        case "d":
        case "D":
          this.d = true;
          break;
        case "a":
        case "A":
          this.a = true;
          break;
        case "r":
        case "R":
          this.r = true;
          break;
        case "f":
        case "F":
          this.f = true;
          break;
        case "z":
        case "Z":
          this.z = true;
          break;
        case "X":
        case "x":
          this.x = true;
          break;
        case "C":
        case "c":
          this.c = true;
          break;
      }
    }
  }

  private keyup(ev: KeyboardEvent) {
    if (!ev.repeat) {
      let temp;

      switch (ev.key) {
        case "Down": // IE/Edge specific value
        case "ArrowDown":
          this.down = false;
          break;
        case "Up": // IE/Edge specific value
        case "ArrowUp":
          this.up = false;
          break;
        case "Left": // IE/Edge specific value
        case "ArrowLeft":
          this.left = false;
          break;
        case "Right": // IE/Edge specific value
        case "ArrowRight":
          this.right = false;
          break;
        case "q": // IE/Edge specific value
        case "Q":
          this.q = false;
          break;
        case "e": // IE/Edge specific value
        case "E":
          this.e = false;
          break;
        case "w":
        case "W":
          this.w = false;
          break;
        case "s":
        case "S":
          this.s = false;
          break;
        case "d":
        case "D":
          this.d = false;
          break;
        case "a":
        case "A":
          this.a = false;
          break;
        case "r":
        case "R":
          this.r = false;
          break;
        case "f":
        case "F":
          this.f = false;
          break;
        case "z":
        case "Z":
          this.z = false;
          break;
        case "X":
        case "x":
          this.x = false;
          break;
        case "C":
        case "c":
          this.c = false;
          break;
      }
    }
  }

  public getRoll() {
    if (this.left && !this.right) {
      return 1;
    }
    if (this.right && !this.left) {
      return - 1;
    }
    return 0;
  }

  public getPitch() {
    if (this.up && !this.down) {
      return 1;
    }
    if (this.down && !this.up) {
      return - 1;
    }
    return 0;
  }

  public getYaw() {
    if (this.d && !this.a) {
      return 1;
    }
    if (this.a && !this.d) {
      return - 1;
    }
    return 0;
  }

  public getRight() {
    if (this.e && !this.q) {
      return 1;
    }
    if (this.q && !this.e) {
      return - 1;
    }
    return 0;
  }

  public getRise() {
    if (this.r && !this.f) {
      return 1;
    }
    if (this.f && !this.r) {
      return - 1;
    }
    return 0;
  }

  public getForward() {
    if (this.w && !this.s) {
      return 1;
    }
    if (this.s && !this.w) {
      return - 1;
    }
    return 0;
  }

  public getZoom() {
    if (this.z && !this.x && !this.c) {
      return -1;
    }
    if (this.x && !this.z && !this.c) {
      return 1;
    }
    return 0;
  }

  public getZoomReset() {
    return this.c;
  }
}
