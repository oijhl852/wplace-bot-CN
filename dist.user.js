// ==UserScript==
// @name         wplace-bot-CN
// @namespace    https://github.com/SoundOfTheSky
// @version      4.6.0
// @description  在 https://wplace.live 网站上自动绘制的机器人 (支持 EN/中 切换)
// @author       SoundOfTheSky
// @license      MPL-2.0
// @homepageURL  https://github.com/oijhl852/wplace-bot-CN
// @updateURL    https://raw.githubusercontent.com/oijhl852/wplace-bot-CN/refs/heads/main/dist.user.js
// @downloadURL  https://raw.githubusercontent.com/oijhl852/wplace-bot-CN/refs/heads/main/dist.user.js
// @run-at       document-start
// @match        *://*.wplace.live/*
// @grant        none
// ==/UserScript==

// Wplace  --> https://wplace.live
// License --> https://www.mozilla.org/en-US/MPL/2.0/

// node_modules/@softsky/utils/dist/arrays.js
function swap(array, index, index2) {
  const temporary = array[index2];
  array[index2] = array[index];
  array[index] = temporary;
  return array;
}
function removeFromArray(array, value) {
  const index = array.indexOf(value);
  if (index !== -1)
    array.splice(index, 1);
  return index;
}
// node_modules/@softsky/utils/dist/objects.js
class Base {
  static lastId = 0;
  static idMap = new Map;
  static subclasses = new Map;
  runOnDestroy = [];
  _id;
  get id() {
    return this._id;
  }
  set id(value) {
    Base.idMap.delete(this._id);
    Base.idMap.set(value, this);
    this._id = value;
  }
  constructor(id = ++Base.lastId) {
    this._id = id;
    Base.idMap.set(id, this);
  }
  static registerSubclass() {
    Base.subclasses.set(this.name, this);
  }
  destroy() {
    Base.idMap.delete(this._id);
    for (let index = 0;index < this.runOnDestroy.length; index++)
      this.runOnDestroy[index]();
  }
  registerEvent(target, type, listener, options = {}) {
    options.passive ??= true;
    target.addEventListener(type, listener, options);
    this.runOnDestroy.push(() => {
      target.removeEventListener(type, listener);
    });
  }
}

// node_modules/@softsky/utils/dist/control.js
var lastIncId = Math.floor(Math.random() * 65536);
var SESSION_ID = Math.floor(Math.random() * 4503599627370496).toString(16).padStart(13, "0");
function wait(time) {
  return new Promise((r) => setTimeout(r, time));
}
class SimpleEventSource {
  handlers = new Map;
  send(name, data) {
    return this.handlers.get(name)?.map((handler) => handler(data)) ?? [];
  }
  on(name, handler) {
    let handlers = this.handlers.get(name);
    if (!handlers) {
      handlers = [];
      this.handlers.set(name, handlers);
    }
    handlers.push(handler);
    return () => {
      removeFromArray(handlers, handler);
      if (handlers.length === 0)
        this.handlers.delete(name);
    };
  }
  off(name, handler) {
    const handlers = this.handlers.get(name);
    if (!handlers)
      return;
    removeFromArray(handlers, handler);
    if (handlers.length === 0)
      this.handlers.delete(name);
  }
  get source() {
    return {
      on: this.on.bind(this),
      off: this.off.bind(this)
    };
  }
}
function promisifyEventSource(target, resolveEvents, rejectEvents = ["error"], subName = "addEventListener") {
  return new Promise((resolve, reject) => {
    for (let index = 0;index < resolveEvents.length; index++)
      target[subName]?.(resolveEvents[index], resolve);
    for (let index = 0;index < rejectEvents.length; index++)
      target[subName]?.(rejectEvents[index], reject);
  });
}
// node_modules/@softsky/utils/dist/signals.js
var effectsMap = new WeakMap;
// node_modules/@softsky/utils/dist/time.js
class SpeedCalculator {
  size;
  historyTime;
  sum = 0;
  history = [];
  statsCached;
  startTime = Date.now();
  constructor(size, historyTime = 15000) {
    this.size = size;
    this.historyTime = historyTime;
  }
  push(chunk) {
    if (chunk < 0)
      throw new Error("Negative chunk size");
    const { time, historyTime } = this.getTime();
    this.history.push({ time, chunk });
    if (this.history[0] && this.history[0].time + historyTime < time)
      this.history.shift();
    this.sum += chunk;
    delete this.statsCached;
  }
  get stats() {
    if (!this.statsCached) {
      const speed = this.history.reduce((sum, entry) => sum + entry.chunk, 0) / this.getTime().historyTime * 1000;
      this.statsCached = this.size === undefined ? { speed } : {
        speed,
        percent: this.sum / this.size,
        eta: ~~((this.size - this.sum) / speed) * 1000
      };
    }
    return this.statsCached;
  }
  getTime() {
    const time = Date.now();
    const timeSinceStart = time - this.startTime;
    const historyTime = Math.min(timeSinceStart, this.historyTime);
    return { time, historyTime };
  }
}
// src/base.ts
class Base2 {
  runOnDestroy = [];
  destroy() {
    for (let index = 0;index < this.runOnDestroy.length; index++)
      this.runOnDestroy[index]();
  }
  populateElementsWithSelector(element, selectors) {
    for (const key in selectors) {
      this[key] = element.querySelector(selectors[key]);
    }
  }
  registerEvent(target, type, listener, options = {}) {
    options.passive ??= true;
    target.addEventListener(type, listener, options);
    this.runOnDestroy.push(() => {
      target.removeEventListener(type, listener);
    });
  }
}

// src/colors.ts
function srgbNonlinearTransformInv(c) {
  return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
}
function rgbToOklab(r, g, b) {
  const lr = srgbNonlinearTransformInv(r / 255);
  const lg = srgbNonlinearTransformInv(g / 255);
  const lb = srgbNonlinearTransformInv(b / 255);
  const lp = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const mp = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const sp = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const l = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp;
  const aa = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp;
  const bb = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp;
  return [l, aa, bb];
}
function deltaE2000(lab1, lab2, brightness) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const rad2deg = (rad) => rad * 180 / Math.PI;
  const deg2rad = (deg) => deg * Math.PI / 180;
  const kL = 1, kC = 1, kH = 1;
  const C1 = Math.sqrt(a1 ** 2 + b1 ** 2);
  const C2 = Math.sqrt(a2 ** 2 + b2 ** 2);
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(avgC ** 7 / (avgC ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p ** 2 + b1 ** 2);
  const C2p = Math.sqrt(a2p ** 2 + b2 ** 2);
  const h1p = b1 === 0 && a1p === 0 ? 0 : rad2deg(Math.atan2(b1, a1p)) % 360;
  const h2p = b2 === 0 && a2p === 0 ? 0 : rad2deg(Math.atan2(b2, a2p)) % 360;
  const Lp = L2 - L1;
  const Cp = C2p - C1p;
  let hp = 0;
  if (C1p * C2p !== 0) {
    hp = h2p - h1p;
    if (hp > 180) {
      hp -= 360;
    } else if (hp < -180) {
      hp += 360;
    }
  }
  const Hp = 2 * Math.sqrt(C1p * C2p) * Math.sin(deg2rad(hp) / 2);
  const avgLp = (L1 + L2) / 2;
  const avgCp = (C1p + C2p) / 2;
  let avghp = (h1p + h2p) / 2;
  if (Math.abs(h1p - h2p) > 180) {
    avghp += 180;
  }
  const T = 1 - 0.17 * Math.cos(deg2rad(avghp - 30)) + 0.24 * Math.cos(deg2rad(2 * avghp)) + 0.32 * Math.cos(deg2rad(3 * avghp + 6)) - 0.2 * Math.cos(deg2rad(4 * avghp - 63));
  const SL = 1 + 0.015 * (avgLp - 50) ** 2 / Math.sqrt(20 + (avgLp - 50) ** 2);
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;
  const θ = 30 * Math.exp((-((avghp - 275) / 25)) ** 2);
  const RC = 2 * Math.sqrt(avgCp ** 7 / (avgCp ** 7 + 25 ** 7));
  const RT = -RC * Math.sin(deg2rad(2 * θ));
  return Math.sqrt((Lp / (kL * SL)) ** 2 + (Cp / (kC * SC)) ** 2 + (Hp / (kH * SH)) ** 2 + RT * (Cp / (kC * SC)) * (Hp / (kH * SH))) - Lp * brightness;
}
var COLORS = [
  [Number.NaN, Number.NaN, Number.NaN],
  [0, 0, 0],
  [0.356, 0, 0],
  [0.573, 0, 0],
  [0.864, 0, 0],
  [1, 0, 0],
  [0.31, 0.119, 0.037],
  [0.603, 0.209, 0.107],
  [0.732, 0.118, 0.137],
  [0.791, 0.039, 0.16],
  [0.895, -0.026, 0.168],
  [0.974, -0.019, 0.077],
  [0.691, -0.154, 0.075],
  [0.812, -0.185, 0.096],
  [0.898, -0.17, 0.149],
  [0.541, -0.097, 0.005],
  [0.678, -0.114, -0.018],
  [0.814, -0.15, 0.011],
  [0.447, -0.019, -0.134],
  [0.65, -0.048, -0.137],
  [0.895, -0.124, -0.027],
  [0.561, 0.054, -0.229],
  [0.771, 0, -0.11],
  [0.431, 0.145, -0.143],
  [0.557, 0.168, -0.127],
  [0.796, 0.102, -0.097],
  [0.551, 0.225, -0.023],
  [0.62, 0.238, 0],
  [0.759, 0.127, 0.006],
  [0.428, 0.036, 0.041],
  [0.552, 0.03, 0.092],
  [0.817, 0.055, 0.097],
  [0.738, 0, 0],
  [0.46, 0.163, 0.074],
  [0.735, 0.134, 0.071],
  [0.642, 0.137, 0.122],
  [0.794, 0.023, 0.054],
  [0.62, -0.005, 0.105],
  [0.747, -0.019, 0.138],
  [0.864, -0.023, 0.136],
  [0.489, -0.06, 0.058],
  [0.609, -0.092, 0.08],
  [0.76, -0.099, 0.085],
  [0.54, -0.067, -0.079],
  [0.941, -0.064, -0.007],
  [0.803, -0.05, -0.096],
  [0.438, 0.048, -0.192],
  [0.421, 0.03, -0.102],
  [0.593, 0.036, -0.119],
  [0.781, 0.031, -0.09],
  [0.757, 0.036, 0.098],
  [0.676, 0.076, 0.09],
  [0.868, 0.051, 0.061],
  [0.524, 0.087, 0.047],
  [0.684, 0.091, 0.045],
  [0.835, 0.068, 0.048],
  [0.519, 0.022, 0.034],
  [0.629, 0.017, 0.043],
  [0.342, -0.004, -0.016],
  [0.564, 0, -0.038],
  [0.789, 0.003, -0.035],
  [0.502, -0.006, 0.055],
  [0.638, -0.005, 0.047],
  [0.82, -0.007, 0.053]
];
var COLORS_RGB = [
  "NaN",
  "0,0,0",
  "60,60,60",
  "120,120,120",
  "210,210,210",
  "255,255,255",
  "96,0,24",
  "237,28,36",
  "255,127,39",
  "246,170,9",
  "249,221,59",
  "255,250,188",
  "14,185,104",
  "19,230,123",
  "135,255,94",
  "12,129,110",
  "16,174,166",
  "19,225,190",
  "40,80,158",
  "64,147,228",
  "96,247,242",
  "107,80,246",
  "153,177,251",
  "120,12,153",
  "170,56,185",
  "224,159,249",
  "203,0,122",
  "236,31,128",
  "243,141,169",
  "104,70,52",
  "149,104,42",
  "248,178,119",
  "170,170,170",
  "165,14,30",
  "250,128,114",
  "228,92,26",
  "214,181,148",
  "156,132,49",
  "197,173,49",
  "232,212,95",
  "74,107,58",
  "90,148,74",
  "132,197,115",
  "15,121,159",
  "187,250,242",
  "125,199,255",
  "77,49,184",
  "74,66,132",
  "122,113,196",
  "181,174,241",
  "219,164,99",
  "209,128,81",
  "255,197,165",
  "155,82,73",
  "209,128,120",
  "250,182,164",
  "123,99,82",
  "156,132,107",
  "51,57,65",
  "109,117,141",
  "179,185,209",
  "109,100,63",
  "148,140,107",
  "205,197,158"
];
function colorToCSS(colorId) {
  if (colorId === 0)
    return "transparent";
  const color = COLORS[colorId];
  return `oklab(${color[0] * 100}% ${color[1]} ${color[2]})`;
}

// src/image.html
var image_default = `<div class="wtopbar">\r
  <button class="hide" data-i18n-title="image.hide">👁</button>\r
  <button class="export" data-i18n-title="image.export">📤</button>\r
  <button class="lock" data-i18n-title="image.lock">🔓</button>\r
  <button class="delete" data-i18n-title="image.delete">❌</button>\r
</div>\r
<div class="wrapper">\r
  <div class="wform">\r
    <div class="wprogress"><div></div><span></span></div>\r
    <div class="colors"></div>\r
    <label><span data-i18n="image.opacity"></span>:&nbsp;<input class="opacity" type="range" min="0" max="100"/></label>\r
    <label><span data-i18n="image.brightness"></span>:&nbsp;<input class="brightness" type="number" step="0.1"/></label>\r
    <label>\r
      <span data-i18n="image.strategy"></span>:&nbsp;<select class="strategy">\r
        <option value="RANDOM" selected data-i18n="image.strategy.random">Random</option>\r
        <option value="DOWN" data-i18n="image.strategy.down">Down</option>\r
        <option value="UP" data-i18n="image.strategy.up">Up</option>\r
        <option value="LEFT" data-i18n="image.strategy.left">Left</option>\r
        <option value="RIGHT" data-i18n="image.strategy.right">Right</option>\r
        <option value="SPIRAL_FROM_CENTER" data-i18n="image.strategy.spiralOut">Spiral out</option>\r
        <option value="SPIRAL_TO_CENTER" data-i18n="image.strategy.spiralIn">Spiral in</option>\r
      </select>\r
    </label>\r
    <button class="reset-size"><span data-i18n="image.resetSize"></span> [<span></span> <span data-i18n="image.pixels"></span>]</button>\r
    <label class="coord-label"><span class="coord-icon">📍</span> <span data-i18n="image.coord"></span>: <span class="coords"></span></label>\r
    <div class="crop-section">\r
      <div class="crop-line">\r
        <button class="crop-left" data-i18n="image.crop.left">←</button>\r
        <button class="crop-right" data-i18n="image.crop.right">→</button>\r
        <button class="crop-up" data-i18n="image.crop.top">↑</button>\r
        <button class="crop-down" data-i18n="image.crop.bottom">↓</button>\r
        <span class="crop-hint" data-i18n="image.crop">Crop</span>\r
      </div>\r
      <div class="crop-line">\r
        <input class="crop-input" id="cropL" type="number" min="0" value="0" data-i18n-placeholder="image.crop.left"/>\r
        <input class="crop-input" id="cropR" type="number" min="0" value="0" data-i18n-placeholder="image.crop.right"/>\r
        <input class="crop-input" id="cropT" type="number" min="0" value="0" data-i18n-placeholder="image.crop.top"/>\r
        <input class="crop-input" id="cropB" type="number" min="0" value="0" data-i18n-placeholder="image.crop.bottom"/>\r
        <button class="crop-apply" data-i18n="image.crop.apply">Apply</button>\r
      </div>\r
    </div>\r
    <label>\r
      <input type="checkbox" class="draw-transparent"/>&nbsp;<span data-i18n="image.drawTransparent"></span>\r
    </label>\r
    <label>\r
      <input type="checkbox" class="draw-colors-in-order"/>&nbsp;<span data-i18n="image.drawColorsInOrder"></span>\r
    </label>\r
  </div>\r
  <div class="resize n"></div>\r
  <div class="resize e"></div>\r
  <div class="resize s"></div>\r
  <div class="resize w"></div>\r
</div>\r
`;

// src/pixels.ts
class Pixels {
  bot;
  image;
  width;
  brightness;
  exactColor;
  static async fromJSON(bot, data) {
    const image = new Image;
    image.src = data.url.startsWith("http") ? await fetch(data.url, { cache: "no-store" }).then((x) => x.blob()).then((X) => URL.createObjectURL(X)) : data.url;
    await promisifyEventSource(image, ["load"], ["error"]);
    return new Pixels(bot, image, data.width, data.brightness, data.exactColor);
  }
  canvas = document.createElement("canvas");
  context = this.canvas.getContext("2d");
  pixels;
  colors = new Map;
  resolution;
  get height() {
    return this.width / this.resolution | 0;
  }
  set height(value) {
    this.width = value * this.resolution | 0;
  }
  constructor(bot, image, width = image.naturalWidth, brightness = 0, exactColor = false) {
    this.bot = bot;
    this.image = image;
    this.width = width;
    this.brightness = brightness;
    this.exactColor = exactColor;
    if (exactColor) {
      this.resolution = 1;
      this.width = 1000;
    } else
      this.resolution = this.image.naturalWidth / this.image.naturalHeight;
    this.update();
  }
  update() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.colors.clear();
    const colorCache = new Map;
    for (let index = 1;index < 64; index++) {
      if (this.exactColor || !this.bot.unavailableColors.has(index))
        colorCache.set(COLORS_RGB[index], [index, index]);
    }
    this.context.imageSmoothingEnabled = false;
    this.context.imageSmoothingQuality = "low";
    this.context.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
    this.pixels = Array.from({ length: this.canvas.height }, () => new Array(this.canvas.width));
    const data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    for (let y = 0;y < this.canvas.height; y++) {
      for (let x = 0;x < this.canvas.width; x++) {
        const index = (y * this.canvas.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        const key = `${r},${g},${b}`;
        if (this.exactColor) {
          this.pixels[y][x] = a < 100 ? 0 : COLORS_RGB.indexOf(key);
          continue;
        }
        let min;
        let minReal;
        if (a < 100)
          min = minReal = 0;
        else if (colorCache.has(key))
          [min, minReal] = colorCache.get(key);
        else {
          let minDelta = Infinity;
          let minDeltaReal = Infinity;
          for (let colorIndex = 0;colorIndex < COLORS.length; colorIndex++) {
            const color = COLORS[colorIndex];
            const delta = deltaE2000(rgbToOklab(r, g, b), color, this.brightness);
            if (!this.bot.unavailableColors.has(colorIndex) && delta < minDelta) {
              minDelta = delta;
              min = colorIndex;
            }
            if (delta < minDeltaReal) {
              minDeltaReal = delta;
              minReal = colorIndex;
            }
          }
          colorCache.set(key, [min, minReal]);
        }
        if (min !== 0) {
          this.context.fillStyle = `oklab(${COLORS[min][0] * 100}% ${COLORS[min][1]} ${COLORS[min][2]})`;
          this.context.fillRect(x, y, 1, 1);
        }
        this.pixels[y][x] = min;
        const stat = this.colors.get(minReal);
        if (stat)
          stat.amount++;
        else {
          this.colors.set(minReal, {
            color: min,
            amount: 1,
            realColor: minReal
          });
        }
      }
    }
  }
  crop(left, right, top, bottom) {
    const newWidth = this.pixels[0].length - left - right;
    const newHeight = this.pixels.length - top - bottom;
    if (newWidth <= 0 || newHeight <= 0)
      return;
    if (left < 0 || right < 0 || top < 0 || bottom < 0)
      return;
    this.pixels = this.pixels.slice(top, top + newHeight).map((row) => row.slice(left, left + newWidth));
    this.colors.clear();
    for (const row of this.pixels)
      for (const colorIndex of row) {
        if (colorIndex === 0)
          continue;
        const stat = this.colors.get(colorIndex);
        if (stat)
          stat.amount++;
        else
          this.colors.set(colorIndex, { color: colorIndex, amount: 1, realColor: colorIndex });
      }
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.width = newWidth;
    const data = this.context.createImageData(newWidth, newHeight);
    for (let y = 0;y < newHeight; y++)
      for (let x = 0;x < newWidth; x++) {
        const ci = this.pixels[y][x];
        if (ci === 0)
          continue;
        const rgb = COLORS_RGB[ci];
        if (!rgb)
          continue;
        const [r, g, b] = rgb.split(",").map(Number);
        const idx = (y * newWidth + x) * 4;
        data.data[idx] = r;
        data.data[idx + 1] = g;
        data.data[idx + 2] = b;
        data.data[idx + 3] = 255;
      }
    this.context.putImageData(data, 0, 0);
  }
  toJSON() {
    const canvas = document.createElement("canvas");
    canvas.width = this.image.naturalWidth;
    canvas.height = this.image.naturalHeight;
    const context = canvas.getContext("2d");
    context.drawImage(this.image, 0, 0);
    return {
      url: canvas.toDataURL("image/webp", 1),
      width: this.width,
      brightness: this.brightness,
      exactColor: this.exactColor
    };
  }
}

// src/save.ts
function loadSave() {
  const json = localStorage.getItem("wbot");
  let save;
  try {
    save = JSON.parse(json);
    if (typeof save !== "object")
      throw new Error("NOT VALID SAVE");
    if (save.version === 1) {
      const _save = save;
      save.images = _save.widget.images;
      save.strategy = _save.widget.strategy;
      delete _save.widget;
    }
  } catch {
    localStorage.removeItem("wbot");
    save = undefined;
  }
  return save;
}
var saveTimeout;
function save(bot, immediate = false) {
  clearTimeout(saveTimeout);
  if (immediate)
    localStorage.setItem("wbot", JSON.stringify(bot));
  else
    saveTimeout = setTimeout(() => {
      localStorage.setItem("wbot", JSON.stringify(bot));
    }, 1000);
}

// src/world-position.ts
var WORLD_TILE_SIZE = 1000;
var WORLD_TILES = 2048;
var WORLD_PIXEL_SIZE = WORLD_TILE_SIZE * WORLD_TILES;
var FAVORITE_LOCATIONS_POSITIONS = [];
var FAVORITE_LOCATIONS = [];
var lastId = Date.now();
function addFavoriteLocation(position) {
  FAVORITE_LOCATIONS_POSITIONS.push(position);
  FAVORITE_LOCATIONS.push({
    id: lastId++,
    latitude: (2 * Math.atan(Math.exp(-(position.y / WORLD_PIXEL_SIZE * (2 * Math.PI) - Math.PI))) - Math.PI / 2) * 180 / Math.PI,
    longitude: (position.x / WORLD_PIXEL_SIZE * (2 * Math.PI) - Math.PI) * 180 / Math.PI,
    name: "WBOT_FAVORITE"
  });
}
addFavoriteLocation({
  x: WORLD_PIXEL_SIZE / 3 | 0,
  y: WORLD_PIXEL_SIZE / 3 | 0
});
addFavoriteLocation({
  x: WORLD_PIXEL_SIZE / 3 * 2 | 0,
  y: WORLD_PIXEL_SIZE / 3 * 2 | 0
});
function extractScreenPositionFromStar($star) {
  const [x, y] = $star.style.transform.slice(32, -31).split(", ").map((x2) => Number.parseFloat(x2));
  return { x, y };
}

class WorldPosition {
  bot;
  static fromJSON(bot, data) {
    return new WorldPosition(bot, ...data);
  }
  static fromScreenPosition(bot, position) {
    const { anchorScreenPosition, pixelSize, anchorWorldPosition } = bot.findAnchorsForScreen(position);
    return new WorldPosition(bot, anchorWorldPosition.x + (position.x - anchorScreenPosition.x) / pixelSize | 0, anchorWorldPosition.y + (position.y - anchorScreenPosition.y) / pixelSize | 0);
  }
  globalX = 0;
  globalY = 0;
  get tileX() {
    return this.globalX / WORLD_TILE_SIZE | 0;
  }
  set tileX(value) {
    this.globalX = value * WORLD_TILE_SIZE + this.x;
  }
  get tileY() {
    return this.globalY / WORLD_TILE_SIZE | 0;
  }
  set tileY(value) {
    this.globalY = value * WORLD_TILE_SIZE + this.y;
  }
  get x() {
    return this.globalX % WORLD_TILE_SIZE;
  }
  set x(value) {
    this.globalX = this.tileX * WORLD_TILE_SIZE + value;
  }
  get y() {
    return this.globalY % WORLD_TILE_SIZE;
  }
  set y(value) {
    this.globalY = this.tileY * WORLD_TILE_SIZE + value;
  }
  anchor1Index;
  anchor2Index;
  get pixelSize() {
    return (extractScreenPositionFromStar(this.bot.$stars[this.anchor2Index]).x - extractScreenPositionFromStar(this.bot.$stars[this.anchor1Index]).x) / (FAVORITE_LOCATIONS_POSITIONS[this.anchor2Index].x - FAVORITE_LOCATIONS_POSITIONS[this.anchor1Index].x);
  }
  constructor(bot, tileorGlobalX, tileorGlobalY, x, y) {
    this.bot = bot;
    if (x === undefined || y === undefined) {
      this.globalX = tileorGlobalX;
      this.globalY = tileorGlobalY;
    } else {
      this.globalX = tileorGlobalX * WORLD_TILE_SIZE + x;
      this.globalY = tileorGlobalY * WORLD_TILE_SIZE + y;
    }
    this.updateAnchor();
  }
  updateAnchor() {
    this.anchor1Index = 0;
    this.anchor2Index = 1;
    let min1 = Infinity;
    let min2 = Infinity;
    for (let index = 0;index < FAVORITE_LOCATIONS_POSITIONS.length; index++) {
      const { x, y } = FAVORITE_LOCATIONS_POSITIONS[index];
      if (x < this.globalX && y < this.globalY) {
        const delta = this.globalX - x + (this.globalY - y);
        if (delta < min1) {
          min1 = delta;
          this.anchor1Index = index;
        }
      } else if (x > this.globalX && y > this.globalY) {
        const delta = x - this.globalX + (y - this.globalY);
        if (delta < min2) {
          min2 = delta;
          this.anchor2Index = index;
        }
      }
    }
  }
  toScreenPosition() {
    const worldPosition = FAVORITE_LOCATIONS_POSITIONS[this.anchor1Index];
    const screenPosition = extractScreenPositionFromStar(this.bot.$stars[this.anchor1Index]);
    return {
      x: (this.globalX - worldPosition.x) * this.pixelSize + screenPosition.x,
      y: (this.globalY - worldPosition.y) * this.pixelSize + screenPosition.y
    };
  }
  getMapColor() {
    return this.bot.mapsCache.get(this.tileX + "/" + this.tileY).pixels[this.y][this.x];
  }
  scrollScreenTo() {
    const { x, y } = this.toScreenPosition();
    this.bot.moveMap({
      x: x - window.innerWidth / 3,
      y: y - window.innerHeight / 3
    });
  }
  clone() {
    return new WorldPosition(this.bot, this.tileX, this.tileY, this.x, this.y);
  }
  toJSON() {
    return [this.globalX, this.globalY];
  }
}

// src/i18n.ts
var locales = {
  en: {
    "widget.title": "wplace-bot",
    "widget.draw": "Draw",
    "widget.addImage": "Add image",
    "widget.strategy": "Strategy",
    "widget.strategy.sequential": "Sequential",
    "widget.strategy.all": "All",
    "widget.strategy.percentage": "Percentage",
    "widget.progress": (d, t, p, h) => `${d}/${t} ${p}% est: ${h}h`,
    "widget.status.initializing": "Initializing",
    "widget.status.drawing": "Drawing",
    "widget.status.initDraw": "Init draw",
    "widget.status.readMap": (n, t) => `Read map [${n}/${t}]`,
    "widget.status.unfocus": "Unfocus window",
    "widget.status.waiting": (name) => `Waiting ${name}`,
    "widget.status.addImage": "Adding image",
    "widget.langToggle": "EN/中",
    "image.opacity": "Opacity",
    "image.brightness": "Brightness",
    "image.strategy": "Strategy",
    "image.strategy.random": "Random",
    "image.strategy.down": "Down",
    "image.strategy.up": "Up",
    "image.strategy.left": "Left",
    "image.strategy.right": "Right",
    "image.strategy.spiralOut": "Spiral out",
    "image.strategy.spiralIn": "Spiral in",
    "image.resetSize": "Reset size",
    "image.pixels": "pixels",
    "image.coord": "Coord",
    "image.crop": "Crop",
    "image.crop.apply": "Apply",
    "image.crop.left": "L",
    "image.crop.right": "R",
    "image.crop.top": "T",
    "image.crop.bottom": "B",
    "image.drawTransparent": "Erase transparent pixels",
    "image.drawColorsInOrder": "Draw colors in order",
    "image.progress": (d, t, p, h) => `${d}/${t} ${p}% est: ${h}h`,
    "error.notInitialized": "❌ Not initialized",
    "error.noImage": "❌ No image selected",
    "image.hide": "Hide / Show",
    "image.export": "Export",
    "image.lock": "Lock / Unlock",
    "image.delete": "Delete",
    "wait.login": "login",
    "wait.pixelCount": "pixel count",
    "wait.canvas": "canvas"
  },
  "zh-CN": {
    "widget.title": "wplace-bot-CN",
    "widget.draw": "绘制",
    "widget.addImage": "添加图片",
    "widget.strategy": "策略",
    "widget.strategy.sequential": "顺序",
    "widget.strategy.all": "全部",
    "widget.strategy.percentage": "百分比",
    "widget.progress": (d, t, p, h) => `${d}/${t} ${p}% 预计: ${h}小时`,
    "widget.status.initializing": "初始化中",
    "widget.status.drawing": "绘制中",
    "widget.status.initDraw": "初始化绘制",
    "widget.status.readMap": (n, t) => `读取地图 [${n}/${t}]`,
    "widget.status.unfocus": "取消聚焦窗口",
    "widget.status.waiting": (name) => `等待 ${name}`,
    "widget.status.addImage": "添加图片中",
    "widget.langToggle": "中/EN",
    "image.opacity": "不透明度",
    "image.brightness": "亮度",
    "image.strategy": "策略",
    "image.strategy.random": "随机",
    "image.strategy.down": "向下",
    "image.strategy.up": "向上",
    "image.strategy.left": "向左",
    "image.strategy.right": "向右",
    "image.strategy.spiralOut": "向外螺旋",
    "image.strategy.spiralIn": "向内螺旋",
    "image.resetSize": "重置大小",
    "image.pixels": "像素",
    "image.coord": "坐标",
    "image.crop": "裁切",
    "image.crop.apply": "执行",
    "image.crop.left": "左",
    "image.crop.right": "右",
    "image.crop.top": "上",
    "image.crop.bottom": "下",
    "image.drawTransparent": "擦除透明像素",
    "image.drawColorsInOrder": "按顺序绘制颜色",
    "image.progress": (d, t, p, h) => `${d}/${t} ${p}% 预计: ${h}小时`,
    "error.notInitialized": "❌ 未初始化",
    "error.noImage": "❌ 未选择图片",
    "image.hide": "隐藏 / 显示",
    "image.export": "导出",
    "image.lock": "锁定 / 解锁",
    "image.delete": "删除",
    "wait.login": "登录",
    "wait.pixelCount": "pixel count",
    "wait.canvas": "画布"
  }
};
var STORAGE_KEY = "wbot-lang";
var currentLang = localStorage.getItem(STORAGE_KEY) ?? detectBrowserLang();
function detectBrowserLang() {
  const nav = globalThis.navigator;
  const lang = nav?.language ?? "";
  if (lang.startsWith("zh"))
    return "zh-CN";
  return "en";
}
function t(key, ...args) {
  const dict = locales[currentLang];
  if (!dict)
    return key;
  const entry = dict[key];
  if (entry === undefined)
    return key;
  if (typeof entry === "function") {
    return entry(...args);
  }
  return entry;
}
function toggleLang() {
  currentLang = currentLang === "en" ? "zh-CN" : "en";
  localStorage.setItem(STORAGE_KEY, currentLang);
  refreshAll();
}
function translateElement(element) {
  const dict = locales[currentLang];
  if (!dict)
    return;
  const textNodes = element.querySelectorAll("[data-i18n]");
  for (const el of textNodes) {
    const key = el.getAttribute("data-i18n");
    if (!key)
      continue;
    const entry = dict[key];
    if (entry === undefined || typeof entry === "function")
      continue;
    el.textContent = entry;
  }
  const titleNodes = element.querySelectorAll("[data-i18n-title]");
  for (const el of titleNodes) {
    const key = el.getAttribute("data-i18n-title");
    if (!key)
      continue;
    const entry = dict[key];
    if (entry === undefined || typeof entry === "function")
      continue;
    el.title = entry;
  }
  const placeholderNodes = element.querySelectorAll("[data-i18n-placeholder]");
  for (const el of placeholderNodes) {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key)
      continue;
    const entry = dict[key];
    if (entry === undefined || typeof entry === "function")
      continue;
    el.placeholder = entry;
  }
}
function refreshAll() {
  const wbot = globalThis.wbot;
  if (!wbot)
    return;
  translateElement(wbot.widget.element);
  wbot.widget.update();
  for (const img of wbot.images) {
    translateElement(img.element);
    img.update();
  }
}

// src/image.ts
class BotImage extends Base2 {
  bot;
  position;
  pixels;
  strategy;
  opacity;
  drawTransparentPixels;
  drawColorsInOrder;
  colors;
  lock;
  hidden;
  static async fromJSON(bot, data) {
    return new BotImage(bot, WorldPosition.fromJSON(bot, data.position), await Pixels.fromJSON(bot, data.pixels), data.strategy, data.opacity, data.drawTransparentPixels, data.drawColorsInOrder, data.colors, data.lock, data.hidden);
  }
  element = document.createElement("div");
  tasks = [];
  moveInfo;
  $brightness;
  $canvas;
  $colors;
  $delete;
  $hide;
  $drawColorsInOrder;
  $drawTransparent;
  $export;
  $lock;
  $opacity;
  $progressLine;
  $progressText;
  $resetSize;
  $resetSizeSpan;
  $settings;
  $strategy;
  $topbar;
  $coords;
  $cropLeft;
  $cropRight;
  $cropUp;
  $cropDown;
  $cropApply;
  $cropL;
  $cropR;
  $cropT;
  $cropB;
  $wrapper;
  constructor(bot, position, pixels, strategy = "SPIRAL_FROM_CENTER" /* SPIRAL_FROM_CENTER */, opacity = 50, drawTransparentPixels = false, drawColorsInOrder = false, colors = [], lock = false, hidden = false) {
    super();
    this.bot = bot;
    this.position = position;
    this.pixels = pixels;
    this.strategy = strategy;
    this.opacity = opacity;
    this.drawTransparentPixels = drawTransparentPixels;
    this.drawColorsInOrder = drawColorsInOrder;
    this.colors = colors;
    this.lock = lock;
    this.hidden = hidden;
    this.element.innerHTML = image_default;
    this.element.classList.add("wimage");
    document.body.append(this.element);
    this.populateElementsWithSelector(this.element, {
      $brightness: ".brightness",
      $colors: ".colors",
      $delete: ".delete",
      $hide: ".hide",
      $drawColorsInOrder: ".draw-colors-in-order",
      $drawTransparent: ".draw-transparent",
      $export: ".export",
      $lock: ".lock",
      $opacity: ".opacity",
      $progressLine: ".wprogress div",
      $progressText: ".wprogress span",
      $resetSize: ".reset-size",
      $settings: ".wform",
      $strategy: ".strategy",
      $topbar: ".wtopbar",
      $wrapper: ".wrapper",
      $coords: ".coords",
      $cropLeft: ".crop-left",
      $cropRight: ".crop-right",
      $cropUp: ".crop-up",
      $cropDown: ".crop-down",
      $cropApply: ".crop-apply",
      $cropL: "#cropL",
      $cropR: "#cropR",
      $cropT: "#cropT",
      $cropB: "#cropB"
    });
    this.$resetSizeSpan = this.$resetSize.querySelector("span");
    this.$canvas = this.pixels.canvas;
    this.$wrapper.prepend(this.pixels.canvas);
    this.registerEvent(this.$strategy, "change", () => {
      this.strategy = this.$strategy.value;
      save(this.bot);
    });
    let opacityTimeout;
    this.registerEvent(this.$opacity, "input", () => {
      this.opacity = this.$opacity.valueAsNumber;
      this.$opacity.style.setProperty("--val", this.opacity + "%");
      clearTimeout(opacityTimeout);
      opacityTimeout = setTimeout(() => {
        this.update();
        save(this.bot);
      }, 200);
    });
    this.$opacity.style.setProperty("--val", this.opacity + "%");
    let timeout;
    this.registerEvent(this.$brightness, "change", () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.pixels.brightness = this.$brightness.valueAsNumber;
        this.pixels.update();
        this.updateColors();
        this.update();
        save(this.bot);
      }, 1000);
    });
    this.registerEvent(this.$resetSize, "click", () => {
      this.pixels.width = this.pixels.image.naturalWidth;
      this.pixels.update();
      this.updateColors();
      this.update();
      save(this.bot);
    });
    this.registerEvent(this.$drawTransparent, "click", () => {
      this.drawTransparentPixels = this.$drawTransparent.checked;
      save(this.bot);
    });
    this.registerEvent(this.$drawColorsInOrder, "click", () => {
      this.drawColorsInOrder = this.$drawColorsInOrder.checked;
      save(this.bot);
    });
    this.registerEvent(this.$hide, "click", () => {
      this.hidden = !this.hidden;
      this.update();
      save(this.bot);
    });
    this.registerEvent(this.$lock, "click", () => {
      this.lock = !this.lock;
      this.update();
      save(this.bot);
    });
    this.registerEvent(this.$delete, "click", this.destroy.bind(this));
    const doCrop = (left, right, top, bottom) => {
      if (this.lock)
        return;
      this.position.globalX += left;
      this.position.globalY += top;
      this.pixels.crop(left, right, top, bottom);
      this.updateColors();
      this.update();
      save(this.bot);
    };
    this.registerEvent(this.$cropLeft, "click", () => doCrop(1, 0, 0, 0));
    this.registerEvent(this.$cropRight, "click", () => doCrop(0, 1, 0, 0));
    this.registerEvent(this.$cropUp, "click", () => doCrop(0, 0, 1, 0));
    this.registerEvent(this.$cropDown, "click", () => doCrop(0, 0, 0, 1));
    this.registerEvent(this.$cropApply, "click", () => {
      if (this.lock)
        return;
      const left = parseInt(this.$cropL.value) || 0;
      const right = parseInt(this.$cropR.value) || 0;
      const top = parseInt(this.$cropT.value) || 0;
      const bottom = parseInt(this.$cropB.value) || 0;
      if (left > 0)
        this.position.globalX += left;
      if (top > 0)
        this.position.globalY += top;
      this.pixels.crop(left, right, top, bottom);
      this.updateColors();
      this.update();
      save(this.bot);
      this.$cropL.value = "0";
      this.$cropR.value = "0";
      this.$cropT.value = "0";
      this.$cropB.value = "0";
    });
    this.registerEvent(this.$export, "click", this.export.bind(this));
    this.registerEvent(this.$topbar, "mousedown", this.moveStart.bind(this));
    this.registerEvent(this.$canvas, "mousedown", this.moveStart.bind(this));
    this.registerEvent(document, "mouseup", this.moveStop.bind(this));
    this.registerEvent(document, "mousemove", this.move.bind(this));
    for (const $resize of this.element.querySelectorAll(".resize"))
      this.registerEvent($resize, "mousedown", this.resizeStart.bind(this));
    this.update();
    this.updateColors();
  }
  toJSON() {
    return {
      pixels: this.pixels.toJSON(),
      position: this.position.toJSON(),
      strategy: this.strategy,
      opacity: this.opacity,
      drawTransparentPixels: this.drawTransparentPixels,
      drawColorsInOrder: this.drawColorsInOrder,
      colors: this.colors,
      lock: this.lock,
      hidden: this.hidden
    };
  }
  updateTasks() {
    this.tasks.length = 0;
    const position = this.position.clone();
    const skipColors = new Set;
    const colorsOrderMap = new Map;
    for (let index = 0;index < this.colors.length; index++) {
      const drawColor = this.colors[index];
      if (drawColor.disabled)
        skipColors.add(drawColor.realColor);
      colorsOrderMap.set(drawColor.realColor, index);
    }
    for (const { x, y } of this.strategyPositionIterator()) {
      const color = this.pixels.pixels[y][x];
      if (skipColors.has(color))
        continue;
      position.globalX = this.position.globalX + x;
      position.globalY = this.position.globalY + y;
      const mapColor = position.getMapColor();
      if (color !== mapColor && (this.drawTransparentPixels || color !== 0))
        this.tasks.push({
          position: position.clone(),
          color
        });
    }
    if (this.drawColorsInOrder)
      this.tasks.sort((a, b) => (colorsOrderMap.get(a.color) ?? 0) - (colorsOrderMap.get(b.color) ?? 0));
    this.update();
    this.bot.widget.update();
  }
  update() {
    const { x, y } = this.position.toScreenPosition();
    this.element.style.transform = `translate(${x}px, ${y}px)`;
    this.element.style.width = `${this.position.pixelSize * this.pixels.width}px`;
    this.$canvas.style.opacity = `${this.opacity}%`;
    this.$canvas.style.display = this.hidden ? "none" : "";
    this.$wrapper.style.display = this.hidden ? "none" : "";
    this.element.style.zIndex = String(9 + this.bot.images.length - this.bot.images.indexOf(this));
    this.$resetSizeSpan.textContent = this.pixels.width.toString();
    this.$brightness.valueAsNumber = this.pixels.brightness;
    this.$strategy.value = this.strategy;
    this.$opacity.valueAsNumber = this.opacity;
    this.$drawTransparent.checked = this.drawTransparentPixels;
    this.$drawColorsInOrder.checked = this.drawColorsInOrder;
    const maxTasks = this.pixels.pixels.length * this.pixels.pixels[0].length;
    const doneTasks = maxTasks - this.tasks.length;
    const percent = doneTasks / maxTasks * 100 | 0;
    const hours = this.tasks.length / 120 | 0;
    this.$progressText.textContent = t("image.progress", doneTasks, maxTasks, percent, hours);
    this.$progressLine.style.transform = `scaleX(${percent}%)`;
    this.$wrapper.classList[this.lock ? "add" : "remove"]("no-pointer-events");
    this.element.classList[this.lock ? "add" : "remove"]("locked");
    this.$lock.textContent = this.lock ? "\uD83D\uDD12" : "\uD83D\uDD13";
    this.$hide.textContent = this.hidden ? "\uD83D\uDC41‍\uD83D\uDDE8" : "\uD83D\uDC41";
    this.$coords.textContent = `(${this.position.globalX}, ${this.position.globalY})`;
  }
  destroy() {
    super.destroy();
    this.element.remove();
    removeFromArray(this.bot.images, this);
    this.bot.widget.update();
    save(this.bot);
  }
  updateColors() {
    this.$colors.innerHTML = "";
    const pixelsSum = this.pixels.pixels.length * this.pixels.pixels[0].length;
    const itemWidth = 100 / this.pixels.colors.size;
    if (this.colors.length !== this.pixels.colors.size || this.colors.some((x) => !this.pixels.colors.has(x.realColor))) {
      this.colors = this.pixels.colors.values().toArray().sort((a, b) => b.amount - a.amount).map((color) => ({
        realColor: color.realColor,
        disabled: false
      }));
      save(this.bot);
    }
    let nextXPosition = 0;
    for (let index = 0;index < this.colors.length; index++) {
      const drawColor = this.colors[index];
      const color = this.pixels.colors.get(drawColor.realColor);
      let dragging = false;
      const toggleDisabled = () => {
        if (dragging)
          return;
        drawColor.disabled = drawColor.disabled ? undefined : true;
        $button.classList.toggle("color-disabled");
        save(this.bot);
      };
      const $button = document.createElement("button");
      if (drawColor.disabled)
        $button.classList.add("color-disabled");
      if (color.realColor === color.color)
        $button.style.background = colorToCSS(color.realColor);
      else {
        $button.classList.add("substitution");
        $button.style.setProperty("--wreal-color", colorToCSS(color.realColor));
        $button.style.setProperty("--wsubstitution-color", colorToCSS(color.color));
        const $button1 = document.createElement("button");
        const $button2 = document.createElement("button");
        $button1.textContent = "$";
        $button2.textContent = "✓";
        $button1.addEventListener("click", () => {
          document.getElementById("color-" + color.realColor)?.click();
        });
        $button2.addEventListener("click", toggleDisabled);
        $button.append($button1);
        $button.append($button2);
      }
      $button.style.left = nextXPosition + "%";
      const width = color.amount / pixelsSum * 100;
      $button.style.width = width + "%";
      nextXPosition += width;
      $button.style.setProperty("--wleft", itemWidth * index + "%");
      $button.style.setProperty("--wwidth", itemWidth + "%");
      this.$colors.append($button);
      const startDrag = (startEvent) => {
        let newIndex = index;
        const buttonWidth = $button.getBoundingClientRect().width;
        const mouseMoveHandler = (event) => {
          newIndex = Math.min(this.colors.length - 1, Math.max(0, Math.round(index + (event.clientX - startEvent.clientX) / buttonWidth)));
          if (newIndex !== index)
            dragging = true;
          let childIndex = 0;
          for (const $child of this.$colors.children) {
            if ($child === $button)
              continue;
            if (childIndex === newIndex)
              childIndex++;
            $child.style.setProperty("--wleft", itemWidth * childIndex + "%");
            childIndex++;
          }
          $button.style.setProperty("--wleft", itemWidth * newIndex + "%");
        };
        document.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", () => {
          document.removeEventListener("mousemove", mouseMoveHandler);
          if (newIndex !== index)
            this.colors.splice(newIndex, 0, ...this.colors.splice(index, 1));
          save(this.bot);
          $button.removeEventListener("mousedown", startDrag);
          setTimeout(() => {
            this.updateColors();
          }, 200);
        }, {
          once: true
        });
      };
      $button.addEventListener("mousedown", startDrag);
      if (color.realColor === color.color)
        $button.addEventListener("click", toggleDisabled);
    }
  }
  *strategyPositionIterator() {
    const width = this.pixels.pixels[0].length;
    const height = this.pixels.pixels.length;
    switch (this.strategy) {
      case "DOWN" /* DOWN */: {
        for (let y = 0;y < height; y++)
          for (let x = 0;x < width; x++)
            yield { x, y };
        break;
      }
      case "UP" /* UP */: {
        for (let y = height - 1;y >= 0; y--)
          for (let x = 0;x < width; x++)
            yield { x, y };
        break;
      }
      case "LEFT" /* LEFT */: {
        for (let x = 0;x < width; x++)
          for (let y = 0;y < height; y++)
            yield { x, y };
        break;
      }
      case "RIGHT" /* RIGHT */: {
        for (let x = width - 1;x >= 0; x--)
          for (let y = 0;y < height; y++)
            yield { x, y };
        break;
      }
      case "RANDOM" /* RANDOM */: {
        const positions = [];
        for (let y = 0;y < height; y++)
          for (let x = 0;x < width; x++)
            positions.push({ x, y });
        for (let index = positions.length - 1;index >= 0; index--) {
          const index_ = Math.floor(Math.random() * (index + 1));
          const temporary = positions[index];
          positions[index] = positions[index_];
          positions[index_] = temporary;
        }
        yield* positions;
        break;
      }
      case "SPIRAL_FROM_CENTER" /* SPIRAL_FROM_CENTER */:
      case "SPIRAL_TO_CENTER" /* SPIRAL_TO_CENTER */: {
        const visited = new Set;
        const total = width * height;
        let x = Math.floor(width / 2);
        let y = Math.floor(height / 2);
        const directories = [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1]
        ];
        let directionIndex = 0;
        let steps = 1;
        const inBounds = (x2, y2) => x2 >= 0 && x2 < width && y2 >= 0 && y2 < height;
        const emit = function* () {
          let count = 0;
          while (count < total) {
            for (let twice = 0;twice < 2; twice++) {
              for (let index = 0;index < steps; index++) {
                if (inBounds(x, y)) {
                  const key = `${x},${y}`;
                  if (!visited.has(key)) {
                    visited.add(key);
                    yield { x, y };
                    count++;
                    if (count >= total)
                      return;
                  }
                }
                x += directories[directionIndex][0];
                y += directories[directionIndex][1];
              }
              directionIndex = (directionIndex + 1) % 4;
            }
            steps++;
          }
        };
        if (this.strategy === "SPIRAL_FROM_CENTER" /* SPIRAL_FROM_CENTER */)
          yield* emit();
        else {
          const collected = [...emit()];
          for (let index = collected.length - 1;index >= 0; index--)
            yield collected[index];
        }
        break;
      }
    }
  }
  moveStart(event) {
    if (!this.lock)
      this.moveInfo = {
        globalX: this.position.globalX,
        globalY: this.position.globalY,
        clientX: event.clientX,
        clientY: event.clientY
      };
  }
  moveStop() {
    if (this.moveInfo) {
      this.moveInfo = undefined;
      this.position.updateAnchor();
      this.pixels.update();
      this.updateColors();
    }
  }
  move(event) {
    if (!this.moveInfo)
      return;
    const deltaX = Math.round((event.clientX - this.moveInfo.clientX) / this.position.pixelSize);
    const deltaY = Math.round((event.clientY - this.moveInfo.clientY) / this.position.pixelSize);
    if (this.moveInfo.globalX !== undefined) {
      this.position.globalX = deltaX + this.moveInfo.globalX;
      if (this.moveInfo.width !== undefined)
        this.pixels.width = Math.max(1, this.moveInfo.width - deltaX);
    } else if (this.moveInfo.width !== undefined)
      this.pixels.width = Math.max(1, deltaX + this.moveInfo.width);
    if (this.moveInfo.globalY !== undefined) {
      this.position.globalY = deltaY + this.moveInfo.globalY;
      if (this.moveInfo.height !== undefined)
        this.pixels.height = Math.max(1, this.moveInfo.height - deltaY);
    } else if (this.moveInfo.height !== undefined)
      this.pixels.height = Math.max(1, deltaY + this.moveInfo.height);
    this.update();
    save(this.bot);
  }
  resizeStart(event) {
    this.moveInfo = {
      clientX: event.clientX,
      clientY: event.clientY
    };
    const $resize = event.target;
    if ($resize.classList.contains("n")) {
      this.moveInfo.height = this.pixels.height;
      this.moveInfo.globalY = this.position.globalY;
    }
    if ($resize.classList.contains("e"))
      this.moveInfo.width = this.pixels.width;
    if ($resize.classList.contains("s"))
      this.moveInfo.height = this.pixels.height;
    if ($resize.classList.contains("w")) {
      this.moveInfo.width = this.pixels.width;
      this.moveInfo.globalX = this.position.globalX;
    }
  }
  export() {
    const a = document.createElement("a");
    document.body.append(a);
    a.href = URL.createObjectURL(new Blob([JSON.stringify(this.toJSON())], { type: "application/json" }));
    a.download = `${this.pixels.width}x${this.pixels.height}.wbot`;
    a.click();
    URL.revokeObjectURL(a.href);
    a.href = this.pixels.canvas.toDataURL("image/webp", 1);
    a.download = `${this.pixels.width}x${this.pixels.height}.webp`;
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }
}

// src/style.css
var style_default = `/* stylelint-disable declaration-no-important */\r
/* stylelint-disable plugin/no-low-performance-animation-properties */\r
/* stylelint-disable no-descending-specificity */\r
@import 'https://fonts.googleapis.com/css2?family=Tiny5&display=swap';\r
\r
:root {\r
  --hover: #dfdfdf;\r
  --text-invert: #fff;\r
  --error: #f00;\r
  --resize: 8px;\r
  --asdadsasdasdasdasdasd: 1px;\r
  --text: #422e2c;\r
  --background: #fbe3cb;\r
  --background-hover: #f0d1b3;\r
  --background-disabled: #a37648;\r
  --main: #66bbb4;\r
  --main-hover: #48a19a;\r
}\r
\r
.text-yellow-400.cursor-pointer.z-10.maplibregl-marker.maplibregl-marker-anchor-center:nth-child(\r
    -n + FAKE_FAVORITE_LOCATIONS\r
  ) {\r
  display: none;\r
}\r
\r
/** Widget */\r
.wwidget {\r
  position: fixed;\r
  top: 0;\r
  left: 0;\r
  z-index: 1000;\r
  width: 256px;\r
  height: 100dvh;\r
  border-right: var(--text) 2px solid;\r
  background-color: var(--background);\r
  color: var(--text);\r
  font-family: 'Tiny5', sans-serif;\r
  transition: transform 0.5s;\r
  transform: translateX(-100%);\r
  display: flex;\r
  flex-direction: column;\r
}\r
\r
.wwidget .title {\r
  border-bottom: var(--text) 2px solid;\r
  background-color: var(--main);\r
  font-size: 32px;\r
  text-align: center;\r
  flex-shrink: 0;\r
}\r
\r
.wwidget.wopen .wopen-button div {\r
  transform: rotate(180deg);\r
}\r
\r
.wwidget.wopen {\r
  box-shadow: 8px 0 16px -8px var(--main);\r
  transform: translateX(0);\r
}\r
\r
.wwidget .wopen-button div {\r
  transition: transform 0.5s;\r
}\r
\r
.wwidget .wopen-button {\r
  position: absolute;\r
  top: calc(50% - 24px);\r
  right: -24px;\r
  width: 24px;\r
  height: 48px;\r
  border: var(--text) 2px solid;\r
  border-left: none;\r
  background-color: var(--background);\r
  color: var(--text);\r
  cursor: pointer;\r
  z-index: 10;\r
}\r
\r
.wwidget .images {\r
  display: block;\r
  overflow-y: auto;\r
  height: auto;\r
  max-height: 240px;\r
}\r
\r
.wwidget .images .image {\r
  display: flex;\r
  align-items: center;\r
  width: 100%;\r
  height: 64px;\r
}\r
\r
.wwidget .images .image img {\r
  max-width: 100%;\r
  max-height: 100%;\r
  margin: 0 auto;\r
  cursor: pointer;\r
}\r
\r
.wwidget .images .image button {\r
  width: 32px;\r
  height: 64px;\r
  font-weight: bolder;\r
  font-size: 24px;\r
}\r
\r
/** Image */\r
.wimage {\r
  position: fixed;\r
  top: 0;\r
  left: 0;\r
}\r
\r
.wimage.locked:hover .wform {\r
  display: none !important;\r
}\r
\r
.wimage canvas {\r
  width: 100%;\r
  box-shadow: inset var(--text) 0 0 0 2px;\r
  cursor: all-scroll;\r
  image-rendering: pixelated;\r
}\r
\r
.wimage .wform {\r
  position: absolute;\r
  display: none;\r
  width: 100%;\r
  min-width: 256px;\r
  border: var(--text) 2px solid;\r
  background-color: var(--background);\r
  color: var(--text);\r
}\r
\r
.wimage:hover .wrapper .wform {\r
  display: block;\r
}\r
\r
/* Settings */\r
.wform {\r
  font-family: 'Tiny5', sans-serif;\r
}\r
\r
.wform > * {\r
  display: flex;\r
  justify-content: center;\r
  align-items: center;\r
  overflow: hidden;\r
  width: calc(100% - 8px);\r
  margin: 4px;\r
  text-align: center;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
\r
.wform button,\r
.wform input,\r
.wform select,\r
.wform textarea,\r
.wform label:has(input[type='checkbox']) {\r
  padding: 0 8px;\r
  border: var(--text) 2px solid;\r
  cursor: pointer;\r
  transition: background-color 0.2s;\r
}\r
\r
.wform input[type='range'] {\r
  width: 100%;\r
  height: 32px;\r
  background: linear-gradient(\r
    to right,\r
    var(--main) var(--val),\r
    var(--background-disabled) var(--val)\r
  );\r
  cursor: ew-resize;\r
  appearance: none;\r
}\r
\r
.wform input[type='range']::-moz-range-thumb {\r
  width: 0;\r
  height: 0;\r
  opacity: 0;\r
}\r
\r
.wform button:hover,\r
.wform input:hover {\r
  background-color: var(--background-hover);\r
}\r
\r
.wform button:disabled,\r
.wform input:disabled {\r
  background-color: var(--background-disabled);\r
  cursor: no-drop;\r
}\r
\r
.wform label input:not([type='checkbox']) {\r
  width: inherit;\r
}\r
\r
.wform .wprogress {\r
  position: relative;\r
  width: 100%;\r
  margin: 0;\r
}\r
\r
.wform .wprogress div {\r
  position: absolute;\r
  width: 100%;\r
  height: 100%;\r
  background-color: var(--main);\r
  transform-origin: left;\r
}\r
\r
.wform .wprogress span {\r
  z-index: 0;\r
}\r
\r
.wform .colors {\r
  position: relative;\r
  width: 100%;\r
  height: 32px;\r
  margin: 0;\r
  background: repeating-linear-gradient(\r
    25deg,\r
    var(--background),\r
    var(--background),\r
    var(--hover) 8px,\r
    var(--hover) 12px\r
  );\r
  cursor: ew-resize;\r
}\r
\r
.wform .colors > button {\r
  position: absolute;\r
  top: 0;\r
  left: 0;\r
  width: 100%;\r
  height: 100%;\r
  border: none;\r
  cursor: grab;\r
  transition:\r
    0.2s left,\r
    0.2s width,\r
    0.2s filter;\r
}\r
\r
.wform .colors > button:hover {\r
  filter: brightness(0.6);\r
}\r
\r
.wform .colors > button.color-disabled::before {\r
  content: '';\r
  position: absolute;\r
  inset: 0;\r
  z-index: 2;\r
  box-shadow: inset 0 0 0 2px var(--error);\r
  pointer-events: none;\r
}\r
\r
.wform .colors > button.substitution button {\r
  position: absolute;\r
  top: 0;\r
  left: 0;\r
  width: 100%;\r
  height: 100%;\r
  padding: 0 4px;\r
  color: var(--background);\r
  transition: 0.2s filter;\r
}\r
\r
.wform .colors > button.substitution button:hover {\r
  filter: brightness(0.6);\r
}\r
\r
.wform .colors > button.substitution:hover {\r
  filter: none;\r
}\r
\r
.wform .colors > button.substitution button:first-child {\r
  background: var(--wreal-color);\r
  text-align: left;\r
  clip-path: polygon(0 0, 80% 0, 20% 100%, 0 100%);\r
}\r
\r
.wform .colors > button.substitution button:last-child {\r
  background: var(--wsubstitution-color);\r
  text-align: right;\r
  clip-path: polygon(100% 100%, 100% 0, 80% 0, 20% 100%);\r
}\r
\r
.wform .colors:hover > button {\r
  left: var(--wleft) !important;\r
  width: var(--wwidth) !important;\r
}\r
\r
/* Move */\r
.wtopbar {\r
  position: absolute;\r
  top: -24px;\r
  left: 0;\r
  display: flex;\r
  justify-content: end;\r
  align-items: center;\r
  width: 100%;\r
  min-width: min-content;\r
  min-width: 256px;\r
  border: var(--text) 2px solid;\r
  background-color: var(--main);\r
  color: var(--text-invert);\r
  cursor: all-scroll;\r
}\r
\r
.wtopbar button {\r
  display: flex;\r
  justify-content: center;\r
  align-items: center;\r
  width: 24px;\r
  height: 24px;\r
}\r
\r
.wtopbar button:hover {\r
  background-color: var(--main-hover);\r
}\r
\r
/* Resize */\r
.resize {\r
  position: absolute;\r
  width: calc(100% - var(--resize) - var(--resize));\r
  height: calc(100% - var(--resize) - var(--resize));\r
}\r
\r
.resize.n {\r
  top: 0;\r
  left: var(--resize);\r
  height: var(--resize);\r
  cursor: n-resize;\r
}\r
\r
.resize.e {\r
  top: var(--resize);\r
  right: 0;\r
  width: var(--resize);\r
  cursor: e-resize;\r
}\r
\r
.resize.s {\r
  bottom: 0;\r
  left: var(--resize);\r
  height: var(--resize);\r
  cursor: s-resize;\r
}\r
\r
.resize.w {\r
  top: var(--resize);\r
  left: 0;\r
  width: var(--resize);\r
  cursor: w-resize;\r
}\r
\r
/* Hide overlay: hide only canvas+wrapper, keep wtopbar */\r
.wimage.hide-overlay canvas {\r
  display: none;\r
}\r
.wimage.hide-overlay .wrapper {\r
  display: none;\r
}\r
\r
/* Error flash */\r
@keyframes wplace-error-flash {\r
  0%, 100% { border-color: var(--text); }\r
  50% { border-color: var(--error); }\r
}\r
.wstatus.error {\r
  animation: wplace-error-flash 0.5s ease-in-out 3;\r
  color: var(--error);\r
  font-weight: bold;\r
}\r
\r
/* Crop */\r
.coord-label {\r
  font-size: 11px;\r
  justify-content: center;\r
  gap: 4px;\r
}\r
.coord-icon {\r
  font-size: 12px;\r
}\r
.crop-section {\r
  flex-direction: column;\r
  gap: 4px;\r
}\r
.crop-line {\r
  display: flex;\r
  justify-content: center;\r
  align-items: center;\r
  gap: 4px;\r
  width: 100%;\r
}\r
.crop-line button {\r
  width: 32px;\r
  height: 28px;\r
  padding: 0;\r
  font-size: 14px;\r
}\r
.crop-line .crop-hint {\r
  font-size: 11px;\r
  color: var(--text);\r
  opacity: 0.7;\r
  margin-left: 4px;\r
}\r
.crop-input {\r
  width: 48px;\r
  height: 28px;\r
  padding: 0 4px;\r
  text-align: center;\r
  font-size: 12px;\r
}\r
.crop-apply {\r
  height: 28px;\r
  padding: 0 12px;\r
  font-size: 12px;\r
}\r
\r
/* Utility */\r
.wp {\r
  padding: 0 8px;\r
}\r
\r
.hidden {\r
  display: none;\r
}\r
\r
.no-pointer-events {\r
  height: 1px;\r
  pointer-events: none;\r
}\r
\r
/* Language toggle – bottom-left of widget */\r
.wwidget .lang-toggle {\r
  flex-shrink: 0;\r
  align-self: flex-start;\r
  margin: 4px;\r
  padding: 2px 10px;\r
  border: var(--text) 1px solid;\r
  background: var(--background);\r
  color: var(--text);\r
  font-family: 'Tiny5', sans-serif;\r
  font-size: 11px;\r
  cursor: pointer;\r
}\r
.wwidget .lang-toggle:hover {\r
  background: var(--background-hover);\r
}\r
`;

// src/errors.ts
class WPlaceBotError extends Error {
  name = "WPlaceBotError";
  constructor(message, bot) {
    super(message);
    bot.widget.status = message;
  }
}
class NoImageError extends WPlaceBotError {
  name = "NoImageError";
  constructor(bot) {
    super(t("error.noImage"), bot);
  }
}

// src/widget.html
var widget_default = `<button class="wopen-button"><div>></div></button>\r
<div class="title" data-i18n="widget.title">wplace-bot</div>\r
<div class="wform">\r
  <div class="wprogress"><div></div><span></span></div>\r
  <div class="wp wstatus"></div>\r
  <button class="draw" disabled data-i18n="widget.draw">Draw</button>\r
  <label><span data-i18n="widget.strategy"></span>:&nbsp;<select class="strategy">\r
    <option value="SEQUENTIAL" selected data-i18n="widget.strategy.sequential">Sequential</option>\r
    <option value="ALL" data-i18n="widget.strategy.all">All</option>\r
    <option value="PERCENTAGE" data-i18n="widget.strategy.percentage">Percentage</option>\r
  </select></label>\r
  <div class="images"></div>\r
  <!-- <button class="pumpkin-hunt" disabled>Pumpkin Hunt!</button> -->\r
  <button class="add-image" disabled data-i18n="widget.addImage">Add image</button>\r
</div>\r
<button class="lang-toggle" data-i18n="widget.langToggle">中/EN</button>\r
`;

// src/widget.ts
class Widget extends Base2 {
  bot;
  element = document.createElement("div");
  get status() {
    return this.$status.innerHTML;
  }
  set status(value) {
    this.$status.innerHTML = value;
  }
  get open() {
    return this.element.classList.contains("wopen");
  }
  set open(value) {
    if (value)
      this.element.classList.add("wopen");
    else
      this.element.classList.remove("wopen");
  }
  $settings;
  $status;
  $minimize;
  $topbar;
  $draw;
  $addImage;
  $strategy;
  $progressLine;
  $progressText;
  $images;
  $wopenButton;
  constructor(bot) {
    super();
    this.bot = bot;
    this.element.classList.add("wwidget");
    this.element.innerHTML = widget_default;
    translateElement(this.element);
    document.body.append(this.element);
    this.populateElementsWithSelector(this.element, {
      $wopenButton: ".wopen-button",
      $settings: ".wform",
      $status: ".wstatus",
      $minimize: ".minimize",
      $topbar: ".wtopbar",
      $draw: ".draw",
      $addImage: ".add-image",
      $strategy: ".strategy",
      $progressLine: ".wprogress div",
      $progressText: ".wprogress span",
      $images: ".images"
    });
    this.$wopenButton.addEventListener("click", () => this.open = !this.open);
    this.$draw.addEventListener("click", () => this.bot.draw());
    this.$addImage.addEventListener("click", () => this.addImage());
    this.$strategy.addEventListener("change", () => {
      this.bot.strategy = this.$strategy.value;
    });
    this.element.querySelector(".lang-toggle").addEventListener("click", () => toggleLang());
    this.update();
    this.open = true;
  }
  addImage() {
    this.setDisabled("add-image", true);
    return this.run(t("widget.status.addImage"), async () => {
      await this.bot.updateColors();
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,.wbot";
      input.click();
      await promisifyEventSource(input, ["change"], ["cancel", "error"]);
      const file = input.files?.[0];
      if (!file)
        throw new NoImageError(this.bot);
      let botImage;
      if (file.name.endsWith(".wbot")) {
        botImage = await BotImage.fromJSON(this.bot, JSON.parse(await file.text()));
      } else {
        const reader = new FileReader;
        reader.readAsDataURL(file);
        await promisifyEventSource(reader, ["load"], ["error"]);
        const image = new Image;
        image.src = reader.result;
        await promisifyEventSource(image, ["load"], ["error"]);
        botImage = new BotImage(this.bot, WorldPosition.fromScreenPosition(this.bot, {
          x: 256,
          y: 32
        }), new Pixels(this.bot, image));
      }
      this.bot.images.push(botImage);
      await this.bot.readMap();
      botImage.updateTasks();
      save(this.bot, true);
      document.location.reload();
    }, () => {
      this.setDisabled("add-image", false);
    });
  }
  update() {
    this.$strategy.value = this.bot.strategy;
    let maxTasks = 0;
    let totalTasks = 0;
    for (let index = 0;index < this.bot.images.length; index++) {
      const image = this.bot.images[index];
      maxTasks += image.pixels.pixels.length * image.pixels.pixels[0].length;
      totalTasks += image.tasks.length;
    }
    const doneTasks = maxTasks - totalTasks;
    const percent = doneTasks / maxTasks * 100 | 0;
    const hours = totalTasks / 120 | 0;
    this.$progressText.textContent = t("widget.progress", doneTasks, maxTasks, percent, hours);
    this.$progressLine.style.transform = `scaleX(${percent}%)`;
    this.$images.innerHTML = "";
    for (let index = 0;index < this.bot.images.length; index++) {
      const image = this.bot.images[index];
      const $image = document.createElement("div");
      this.$images.append($image);
      $image.className = "image";
      $image.innerHTML = `<img src="${image.pixels.image.src}">
  <button class="up" title="上移" ${index === 0 ? "disabled" : ""}>▴</button>
  <button class="down" title="下移" ${index === this.bot.images.length - 1 ? "disabled" : ""}>▾</button>`;
      $image.querySelector("img").addEventListener("click", () => {
        image.position.scrollScreenTo();
      });
      $image.querySelector(".up").addEventListener("click", () => {
        swap(this.bot.images, index, index - 1);
        this.update();
        save(this.bot);
      });
      $image.querySelector(".down").addEventListener("click", () => {
        swap(this.bot.images, index, index + 1);
        this.update();
        save(this.bot);
      });
    }
  }
  setDisabled(name, disabled) {
    this.element.querySelector("." + name).disabled = disabled;
  }
  async run(status, run, fin, emoji = "⌛") {
    const originalStatus = this.status;
    this.status = `${emoji} ${status}`;
    try {
      const result = await run();
      this.status = originalStatus;
      return result;
    } catch (error) {
      if (!(error instanceof WPlaceBotError)) {
        console.error(error);
        this.status = `❌ ${status}`;
        this.$status.classList.add("error");
        setTimeout(() => this.$status.classList.remove("error"), 2000);
      } else {
        this.$status.classList.add("error");
        setTimeout(() => this.$status.classList.remove("error"), 2000);
      }
      throw error;
    } finally {
      await fin?.();
    }
  }
  minimize() {
    this.$settings.classList.toggle("hidden");
  }
}

// src/bot.ts
var SAVE_VERSION = 2;

class WPlaceBot {
  unavailableColors = new Set;
  mapsCache = new Map;
  me;
  $stars = [];
  strategy = "SEQUENTIAL" /* SEQUENTIAL */;
  images = [];
  widget = new Widget(this);
  markerPixelPositionResolvers = [];
  lastColor;
  constructor() {
    const save2 = loadSave();
    if (save2) {
      for (let index = 0;index < save2.images.length; index++) {
        const image = save2.images[index];
        addFavoriteLocation({
          x: image.position[0] - 1000,
          y: image.position[1] - 1000
        });
        addFavoriteLocation({
          x: image.position[0] + 1000,
          y: image.position[1] + 1000
        });
      }
      this.strategy = save2.strategy;
    }
    this.registerFetchInterceptor();
    const style = document.createElement("style");
    style.textContent = style_default.replace("FAKE_FAVORITE_LOCATIONS", FAVORITE_LOCATIONS.length.toString());
    document.head.append(style);
    this.widget.run(t("widget.status.initializing"), async () => {
      await this.waitForElement("wait.login", ".avatar.center-absolute.absolute");
      await this.waitForElement("wait.pixelCount", ".btn.btn-primary.btn-lg.relative.z-30 canvas");
      const $canvasContainer = await this.waitForElement("wait.canvas", ".maplibregl-canvas-container");
      new MutationObserver((mutations) => {
        for (let index = 0;index < mutations.length; index++)
          if (mutations[index].removedNodes.length !== 0) {
            this.updateStars();
            break;
          }
        this.updateImages();
      }).observe($canvasContainer, {
        attributes: true,
        childList: true,
        subtree: true
      });
      this.updateStars();
      await wait(500);
      await this.updateColors();
      if (save2)
        for (let index = 0;index < save2.images.length; index++) {
          const image = await BotImage.fromJSON(this, save2.images[index]);
          this.images.push(image);
          image.update();
        }
      await this.readMap();
      this.updateTasks();
      this.widget.setDisabled("draw", false);
      this.widget.setDisabled("add-image", false);
    });
  }
  draw() {
    this.widget.setDisabled("draw", true);
    this.widget.status = "";
    this.mapsCache.clear();
    const $canvas = document.querySelector(".maplibregl-canvas");
    const prevent = (event) => {
      if (!event.shiftKey)
        event.stopPropagation();
    };
    return this.widget.run(t("widget.status.drawing"), async () => {
      await this.widget.run(t("widget.status.initDraw"), () => Promise.all([this.updateColors(), this.readMap()]));
      globalThis.addEventListener("mousemove", prevent, true);
      $canvas.addEventListener("wheel", prevent, true);
      this.updateTasks();
      const me = await fetch("https://backend.wplace.live/me", {
        credentials: "include"
      }).then((x) => x.json());
      let charges = Math.floor(me.charges.count);
      let n = 0;
      for (let index = 0;index < this.images.length; index++)
        n += this.images[index].tasks.length;
      switch (this.strategy) {
        case "ALL" /* ALL */: {
          while (charges > 0) {
            let end = true;
            for (let imageIndex = 0;imageIndex < this.images.length; imageIndex++) {
              const task = this.images[imageIndex].tasks.shift();
              if (!task)
                continue;
              this.drawTask(task);
              charges--;
              await wait(1);
              end = false;
            }
            if (end)
              break;
          }
          break;
        }
        case "PERCENTAGE" /* PERCENTAGE */: {
          for (let taskIndex = 0;taskIndex < n && charges > 0; taskIndex++) {
            let minPercent = 1;
            let minImage;
            for (let imageIndex = 0;imageIndex < this.images.length; imageIndex++) {
              const image = this.images[imageIndex];
              const percent = 1 - image.tasks.length / (image.pixels.pixels.length * image.pixels.pixels[0].length);
              if (percent < minPercent) {
                minPercent = percent;
                minImage = image;
              }
            }
            this.drawTask(minImage.tasks.shift());
            charges--;
            await wait(1);
          }
          break;
        }
        case "SEQUENTIAL" /* SEQUENTIAL */: {
          for (let imageIndex = 0;imageIndex < this.images.length; imageIndex++) {
            const image = this.images[imageIndex];
            for (let task = image.tasks.shift();task && charges > 0; task = image.tasks.shift()) {
              this.drawTask(task);
              charges--;
              await wait(1);
            }
          }
        }
      }
      this.widget.update();
    }, () => {
      globalThis.removeEventListener("mousemove", prevent, true);
      $canvas.removeEventListener("wheel", prevent, true);
      this.widget.setDisabled("draw", false);
    });
  }
  toJSON() {
    return {
      version: SAVE_VERSION,
      images: this.images.map((x) => x.toJSON()),
      strategy: this.strategy
    };
  }
  async updateColors() {
    await this.openColors();
    this.unavailableColors.clear();
    for (const $button of document.querySelectorAll("button.btn.relative.w-full"))
      if ($button.children.length !== 0)
        this.unavailableColors.add(Math.abs(Number.parseInt($button.id.slice(6))));
    this.updateImageColors();
  }
  moveMap(delta) {
    const canvas = document.querySelector(".maplibregl-canvas");
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    const endX = startX - delta.x;
    const endY = startY - delta.y;
    function fire(type, x, y) {
      canvas.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        buttons: 1
      }));
    }
    fire("mousedown", startX, startY);
    fire("mousemove", endX, endY);
    fire("mouseup", endX, endY);
  }
  readMap() {
    this.mapsCache.clear();
    const imagesToDownload = new Set;
    for (let index = 0;index < this.images.length; index++) {
      const image = this.images[index];
      const { tileX: tileXEnd, tileY: tileYEnd } = new WorldPosition(this, image.position.globalX + image.pixels.pixels[0].length, image.position.globalY + image.pixels.pixels.length);
      for (let tileX = image.position.tileX;tileX <= tileXEnd; tileX++)
        for (let tileY = image.position.tileY;tileY <= tileYEnd; tileY++)
          imagesToDownload.add(`${tileX}/${tileY}`);
    }
    let done = 0;
    return this.widget.run(t("widget.status.readMap", 0, imagesToDownload.size), () => Promise.all([...imagesToDownload].map(async (x) => {
      this.mapsCache.set(x, await Pixels.fromJSON(this, {
        url: `https://backend.wplace.live/files/s0/tiles/${x}.png`,
        exactColor: true
      }));
      this.widget.status = t("widget.status.readMap", ++done, imagesToDownload.size);
    })));
  }
  waitForUnfocus() {
    return this.widget.run(t("widget.status.unfocus"), () => new Promise((resolve) => {
      if (!document.hasFocus())
        resolve();
      window.addEventListener("blur", () => {
        setTimeout(resolve, 1);
      }, {
        once: true
      });
    }), undefined, "\uD83D\uDDB1️");
  }
  findAnchorsForScreen(position) {
    let anchorIndex = 0;
    let minI2 = 1;
    let min1 = Infinity;
    let min2 = Infinity;
    for (let index = 0;index < this.$stars.length; index++) {
      const { x, y } = extractScreenPositionFromStar(this.$stars[index]);
      if (x < position.x && y < position.y) {
        const delta = position.x - x + (position.y - y);
        if (delta < min1) {
          min1 = delta;
          anchorIndex = index;
        }
      } else if (x > position.x && y > position.y) {
        const delta = x - position.x + (y - position.y);
        if (delta < min2) {
          min2 = delta;
          minI2 = index;
        }
      }
    }
    const anchorScreenPosition = extractScreenPositionFromStar(this.$stars[anchorIndex]);
    const anchorWorldPosition = FAVORITE_LOCATIONS_POSITIONS[anchorIndex];
    return {
      anchorScreenPosition,
      anchorWorldPosition,
      pixelSize: (extractScreenPositionFromStar(this.$stars[minI2]).x - anchorScreenPosition.x) / (FAVORITE_LOCATIONS_POSITIONS[minI2].x - anchorWorldPosition.x)
    };
  }
  async openColors() {
    this.lastColor = undefined;
    document.querySelector(".flex.gap-2.px-3 > .btn-circle")?.click();
    await wait(1);
    document.querySelector(".btn.btn-primary.btn-lg.relative.z-30")?.click();
    await wait(1);
    const unfoldColors = document.querySelector("button.bottom-0");
    if (unfoldColors?.innerHTML === '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" class="size-5"><path d="M480-120 300-300l58-58 122 122 122-122 58 58-180 180ZM358-598l-58-58 180-180 180 180-58 58-122-122-122 122Z"></path></svg><!---->') {
      unfoldColors.click();
      await wait(1);
    }
  }
  drawTask(task) {
    if (this.lastColor !== task.color) {
      document.getElementById("color-" + task.color).click();
      this.lastColor = task.color;
    }
    const halfPixel = task.position.pixelSize / 2;
    const position = task.position.toScreenPosition();
    document.documentElement.dispatchEvent(new MouseEvent("mousemove", {
      bubbles: true,
      clientX: position.x + halfPixel,
      clientY: position.y + halfPixel,
      shiftKey: true
    }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keydown", {
      key: " ",
      code: "Space",
      keyCode: 32,
      which: 32,
      bubbles: true,
      cancelable: true
    }));
    document.documentElement.dispatchEvent(new KeyboardEvent("keyup", {
      key: " ",
      code: "Space",
      keyCode: 32,
      which: 32,
      bubbles: true,
      cancelable: true
    }));
  }
  registerFetchInterceptor() {
    const originalFetch = globalThis.fetch;
    const pixelRegExp = /https:\/\/backend.wplace.live\/s\d+\/pixel\/(-?\d+)\/(-?\d+)\?x=(-?\d+)&y=(-?\d+)/;
    globalThis.fetch = async (request, options) => {
      const response = await originalFetch(request, options);
      const cloned = response.clone();
      let url = "";
      if (typeof request == "string")
        url = request;
      else if (request instanceof Request)
        url = request.url;
      else if (request instanceof URL)
        url = request.href;
      if (response.url === "https://backend.wplace.live/me") {
        this.me = await cloned.json();
        this.me.favoriteLocations.unshift(...FAVORITE_LOCATIONS);
        this.me.maxFavoriteLocations = Infinity;
        response.json = () => Promise.resolve(this.me);
      }
      const pixelMatch = pixelRegExp.exec(url);
      if (pixelMatch) {
        for (let index = 0;index < this.markerPixelPositionResolvers.length; index++)
          this.markerPixelPositionResolvers[index](new WorldPosition(this, +pixelMatch[1], +pixelMatch[2], +pixelMatch[3], +pixelMatch[4]));
        this.markerPixelPositionResolvers.length = 0;
      }
      return response;
    };
  }
  async closeAll() {
    for (const button of document.querySelectorAll("button")) {
      if (button.innerHTML === "✕" || button.innerHTML === `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" class="size-4"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"></path></svg><!---->`) {
        button.click();
        await wait(1);
      }
    }
  }
  waitForElement(nameKey, selector) {
    const displayName = t(nameKey);
    return this.widget.run(t("widget.status.waiting", displayName), () => {
      return new Promise((resolve) => {
        const existing = document.querySelector(selector);
        if (existing) {
          resolve(existing);
          return;
        }
        const observer = new MutationObserver(() => {
          const element = document.querySelector(selector);
          if (element) {
            observer.disconnect();
            resolve(element);
          }
        });
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true
        });
      });
    });
  }
  updateStars() {
    this.$stars = [
      ...document.querySelectorAll(".text-yellow-400.cursor-pointer.z-10.maplibregl-marker.maplibregl-marker-anchor-center")
    ].slice(0, FAVORITE_LOCATIONS.length);
  }
  updateImages() {
    for (let index = 0;index < this.images.length; index++)
      this.images[index].update();
  }
  updateTasks() {
    for (let index = 0;index < this.images.length; index++)
      this.images[index].updateTasks();
  }
  updateImageColors() {
    for (let index = 0;index < this.images.length; index++)
      this.images[index].updateColors();
  }
}
globalThis.wbot = new WPlaceBot;
{
  WPlaceBot
};
