"use strict";

let puzzle, autoStart;
let playing;
let useMouse = true;
let lastMousePos;
let ui; 
const fileExtension = ".puzz";
const fileSignature = "cpzfilecct";

const mhypot = Math.hypot,
  mrandom = Math.random,
  mmax = Math.max,
  mmin = Math.min,
  mround = Math.round,
  mfloor = Math.floor,
  mceil = Math.ceil,
  msqrt = Math.sqrt,
  mabs = Math.abs,
  msin = Math.sin,
  mcos = Math.cos,
  mPI = Math.PI;

const MAT30 = new DOMMatrixReadOnly([mcos(mPI / 6), msin(mPI / 6), -msin(mPI / 6), mcos(mPI / 6), 0, 0]);
const MAT45 = new DOMMatrixReadOnly([mcos(mPI / 4), msin(mPI / 4), -msin(mPI / 4), mcos(mPI / 4), 0, 0]);
const MAT60 = new DOMMatrixReadOnly([mcos(mPI / 3), msin(mPI / 3), -msin(mPI / 3), mcos(mPI / 3), 0, 0]);
const MAT90 = new DOMMatrixReadOnly([0, 1, -1, 0, 0, 0]);
const MAT180 = new DOMMatrixReadOnly([-1, 0, 0, -1, 0, 0]);
const MAT120 = MAT90.multiply(MAT30);
const MAT135 = MAT90.multiply(MAT45);
const MAT150 = MAT90.multiply(MAT60);
const MAT210 = MAT180.multiply(MAT30);
const MAT225 = MAT180.multiply(MAT45);
const MAT240 = MAT180.multiply(MAT60);
const MAT270 = MAT180.multiply(MAT90);
const MAT300 = MAT270.multiply(MAT30);
const MAT315 = MAT270.multiply(MAT45);
const MAT330 = MAT270.multiply(MAT60);

const MATS180 = [, MAT180];
const MATS120 = [, MAT120, MAT240];
const MATS90 = [, MAT90, MAT180, MAT270];
const MATS60 = [, MAT60, MAT120, MAT180, MAT240, MAT300];
const MATS45 = [, MAT45, MAT90, MAT135, MAT180, MAT225, MAT270, MAT315];
const MATS30 = [, MAT30, MAT60, MAT90, MAT120, MAT150, MAT180, MAT210, MAT240, MAT270, MAT300, MAT330];

const MATS = [, MATS180, MATS120, MATS90, MATS60, MATS45, MATS30];

function isMiniature() {
  return location.pathname.includes("/fullcpgrid/"); 
}

function alea(min, max) {
  if (typeof max == "undefined") return min * mrandom();
  return min + (max - min) * mrandom();
}

function intAlea(min, max) {
  if (typeof max == "undefined") {
    max = min;
    min = 0;
  }
  return mfloor(min + (max - min) * mrandom());
} 

function lerp(p0, p1, alpha) {
  return {
    x: p0.x * (1 - alpha) + p1.x * alpha,
    y: p0.y * (1 - alpha) + p1.y * alpha
  };
}

function arrayShuffle(array) {
  let k1, temp;
  for (let k = array.length - 1; k >= 1; --k) {
    k1 = puzzle.prng.intAlea(0, k + 1);
    temp = array[k];
    array[k] = array[k1];
    array[k1] = temp;
  }
  return array;
} 

function mMash(seed) {
  let n = 0xefc8249d;
  let intSeed = (seed || Math.random()).toString();

  function mash(data) {
    if (data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; 
      }
      return (n >>> 0) * 2.3283064365386963e-10; 
    } else n = 0xefc8249d;
  }
  mash(intSeed); 

  let mmash = () => mash("A"); 
  mmash.reset = () => {
    mash();
    mash(intSeed);
  };
  Object.defineProperty(mmash, "seed", { get: () => intSeed });
  mmash.intAlea = function (min, max) {
    if (typeof max == "undefined") {
      max = min;
      min = 0;
    }
    return mfloor(min + (max - min) * this());
  };
  mmash.alea = function (min, max) {
    if (typeof max == "undefined") return min * this();
    return min + (max - min) * this();
  };

  return mmash;
} 

async function saveFile(data, fileName) {
  if (!("showSaveFilePicker" in window) || window.top !== window.self) {
    download(data, fileName, {
      mediaType: "text/plain;charset=utf8",
      preEncoded: false
    });
    return;
  }
  try {
    const pickerOpts = {
      id: "puzz",
      excludeAcceptAllOption: false,
      suggestedName: fileName,
      types: [
        {
          description: "PUZZ file",
          accept: { "text/plain": [".puzz"] }
        }
      ]
    };

    const handle = await showSaveFilePicker(pickerOpts);
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
    return;
  } catch (err) {
    if (err.name == "AbortError") return; 
    popup(["Something went wrong saving your game.", `Error message: ${err}`]);
  }
} 

function download(data, fileName, options = {}) {
  let mediaType = ""; 
  if (typeof options.mediaType == "string") mediaType = options.mediaType;
  let preEncoded = false;
  if (typeof options.preEncoded == "boolean") preEncoded = options.preEncoded;
  if (!preEncoded) data = encodeURIComponent(data);
  let element = document.createElement("a");
  element.setAttribute("href", "data:" + mediaType + "," + data);
  element.setAttribute("download", fileName);
  element.style.display = "none";
  document.body.appendChild(element);
  element.addEventListener("click", (e) => e.stopPropagation());
  element.click();
  document.body.removeChild(element);
} 

class Modal {
  constructor(properties) {
    let modal = document.createElement("dialog");
    modal.style.borderRadius = "5px";
    if (properties.lines) {
      properties.lines.forEach((line) => {
        const p = document.createElement("p");
        p.append(line);
        modal.append(p);
      });
    }
    if (properties?.buttons?.length > 0) {
      const p = document.createElement("p");
      modal.append(p);
      p.style.display = "flex";
      p.style.justifyContent = "center";
      properties.buttons.forEach((buttonObj) => {
        const button = document.createElement("button");
        button.setAttribute("type", "button");
        button.style.marginRight = "1em";
        button.style.marginLeft = "1em";
        button.innerText = buttonObj.text || "button";
        p.append(button);
        button.addEventListener("click", () => {
          modal.remove();
          modal = null;
          if (buttonObj.callback) buttonObj.callback();
        });
      });
    } else {
      modal.addEventListener("click", () => {
        modal.remove();
        modal = null;
      });
    }
    document.body.append(modal);
    modal.showModal();
  } 
} 

function popup(lines) {
  new Modal({
    lines: lines,
    buttons: [{ text: "close" }]
  });
} 

function prepareUI() {
  let menu = document.getElementById("menu");
  let controls = document.getElementById("controls");
  ui = {}; 
  [
    "default", "load", "rotationstep", "shape", "nbpieces", "start", "stop", 
    "helpstorage", "save", "restore", "helpfile", "fsave", "frestore", 
    "help", "saveas", "saveext", "drawmode", "show"
  ].forEach((ctrlName) => (ui[ctrlName] = document.getElementById(ctrlName)));

  ui.open = () => {
    menu.classList.remove("hidden");
    controls.innerHTML = "close controls";
  };
  ui.close = () => {
    menu.classList.add("hidden");
    controls.innerHTML = "open controls";
  };

  ui.waiting = () => {
    ui.default.removeAttribute("disabled");
    ui.load.removeAttribute("disabled");
    ui.shape.removeAttribute("disabled");
    ui.nbpieces.removeAttribute("disabled");
    ui.rotationstep.removeAttribute("disabled");
    ui.start.removeAttribute("disabled");
    ui.stop.setAttribute("disabled", "");
    ui.save.setAttribute("disabled", "");
    ui.restore.removeAttribute("disabled");
    ui.fsave.setAttribute("disabled", "");
    ui.frestore.removeAttribute("disabled");
    ui.show.setAttribute("disabled", "");
  };
  ui.playing = () => {
    ui.default.setAttribute("disabled", "");
    ui.load.setAttribute("disabled", "");
    ui.shape.setAttribute("disabled", "");
    ui.nbpieces.setAttribute("disabled", "");
    ui.rotationstep.setAttribute("disabled", "");
    ui.start.setAttribute("disabled", "");
    ui.stop.removeAttribute("disabled");
    ui.save.removeAttribute("disabled");
    ui.restore.setAttribute("disabled", "");
    ui.fsave.removeAttribute("disabled");
    ui.frestore.setAttribute("disabled", "");
    ui.show.removeAttribute("disabled");
  };

  ui.saveext.innerHTML = fileExtension;
  controls.addEventListener("click", () => {
    if (menu.classList.contains("hidden")) ui.open();
    else ui.close();
  });

  ui.default.addEventListener("click", loadInitialFile);
  ui.load.addEventListener("click", loadFile);
  ui.start.addEventListener("click", startGame);
  ui.stop.addEventListener("click", confirmStop);
  ui.save.addEventListener("click", () => events.push({ event: "save" }));
  ui.restore.addEventListener("click", () => events.push({ event: "restore" }));
  ui.fsave.addEventListener("click", () => events.push({ event: "save", file: true }));
  ui.frestore.addEventListener("click", () => {
    loadSaved(); 
    events.push({ event: "restore", file: true });
  });
  ui.help.addEventListener("click", () => popup(helptext));
  ui.helpstorage.addEventListener("click", () => popup(helpstoragetext));
  ui.helpfile.addEventListener("click", () => popup(helpfiletext));
  ui.show.addEventListener("click", () => puzzle.showImage(true));
}

function generatePoints(t) {
  return t.points.map((p) => {
    let obj = { x: p.x, y: p.y }; 
    if (p.isCorner) obj.isCorner = true;
    if (p.isEdge) obj.isEdge = true;
    return obj;
  });
} 

class SortedArray {
  constructor(fCompar, keepDuplicates = false) {
    this.tb = [];
    this.fCompar = fCompar;
    this.keepDuplicates = keepDuplicates;
  }
  indexOf(thing) {
    this.thing = thing;
    let cmp;
    if (this.tb.length == 0) {
      this.insertAt = 0;
      return -1;
    }
    let a = 0, c = this.tb.length - 1, b;
    do {
      b = Math.floor((a + c) / 2);
      cmp = this.fCompar(this.tb[b], thing);
      switch (true) {
        case cmp < 0:
          if (b == c) {
            this.insertAt = c + 1;
            return -1;
          }
          if (a == b) ++b;
          a = b;
          break;
        case cmp == 0:
          this.insertAt = b;
          return b;
        default:
          if (b == a) {
            this.insertAt = a;
            return -1;
          }
          c = b;
      }
    } while (true);
  }
  doInsert() {
    this.tb.splice(this.insertAt, 0, this.thing);
  }
  insert(thing) {
    if (this.indexOf(thing) != -1 && !this.keepDuplicates) return;
    this.tb.splice(this.insertAt, 0, thing);
  }
}

class Edge {
  constructor(p0, p1) {
    if (p0.kp <= p1.kp) {
      this.p0 = p0; this.p1 = p1;
    } else {
      this.p0 = p1; this.p1 = p0;
    }
    this.tris = [];
  }
  attachTriangle(tri) {
    if (!this.p0.tris.includes(tri)) this.p0.tris.push(tri);
    if (!this.p1.tris.includes(tri)) this.p1.tris.push(tri);
    if (!this.p0.edges.includes(this)) this.p0.edges.push(this);
    if (!this.p1.edges.includes(this)) this.p1.edges.push(this);
    if (tri.a == this.p0) {
      if (tri.b == this.p1) { this.tris[0] = tri; tri.edges[0] = this; }
      else { this.tris[1] = tri; tri.edges[2] = this; }
      return;
    }
    if (tri.b == this.p0) {
      if (tri.c == this.p1) { this.tris[0] = tri; tri.edges[1] = this; }
      else { this.tris[1] = tri; tri.edges[0] = this; }
      return;
    }
    if (tri.c == this.p0) {
      if (tri.a == this.p1) { this.tris[0] = tri; tri.edges[2] = this; }
      else { this.tris[1] = tri; tri.edges[1] = this; }
    }
  }
}

class Triangle {
  constructor(a, b, c) {
    this.a = a; this.b = b; this.c = c;
    this.vertices = [this.a, this.b, this.c];
    const m11 = 2 * (b.x - a.x), m21 = 2 * (c.x - a.x);
    const m12 = 2 * (b.y - a.y), m22 = 2 * (c.y - a.y);
    const c1 = b.x * b.x - a.x * a.x + b.y * b.y - a.y * a.y;
    const c2 = c.x * c.x - a.x * a.x + c.y * c.y - a.y * a.y;
    const det = m11 * m22 - m21 * m12;
    this.xc = (c1 * m22 - c2 * m12) / det;
    this.yc = (m11 * c2 - m21 * c1) / det;
    this.r = Math.hypot(this.xc - this.a.x, this.yc - this.a.y);
  }
  inCircumCircle(p) { return Math.hypot(p.x - this.xc, p.y - this.yc) < this.r; }
  hasEdge(p1, p2) {
    return ((p1 == this.a || p1 == this.b || p1 == this.c) &&
      (p2 == this.a || p2 == this.b || p2 == this.c));
  }
  listTris() {
    let other;
    this.tris = [];
    this.edges.forEach((edge, kEdge) => {
      other = edge.tris[0] == this ? edge.tris[1] : edge.tris[0];
      if (other) this.tris[kEdge] = other;
    });
  }
}

class Delaunay {
  constructor(points, rect) {
    let triangulation, badTriangles, polygon;
    const numPts = points.length;
    const pts = points;
    pts.forEach((p, kp) => (p.kp = kp));
    this.points = pts;
    let supert = [
      { x: rect.p0.x - 1, y: 2 * rect.p1.y - rect.p0.y + 3 },
      { x: rect.p0.x - 1, y: rect.p0.y - 1 },
      { x: 2 * rect.p1.x - rect.p0.x + 3, y: rect.p0.y - 1 }
    ];
    triangulation = [new Triangle(...supert)];
    for (let kp = 0; kp < numPts; ++kp) {
      let point = pts[kp];
      badTriangles = [];
      for (let kt = 0; kt < triangulation.length; ++kt) {
        if (triangulation[kt].inCircumCircle(point))
          badTriangles.push(triangulation[kt]);
      }
      polygon = [];
      for (let kt = 0; kt < badTriangles.length; ++kt) {
        let tri = badTriangles[kt];
        if (!badTriangles.some((othertri) => othertri !== tri && othertri.hasEdge(tri.a, tri.b)))
          polygon.push([tri.a, tri.b]);
        if (!badTriangles.some((othertri) => othertri !== tri && othertri.hasEdge(tri.b, tri.c)))
          polygon.push([tri.b, tri.c]);
        if (!badTriangles.some((othertri) => othertri !== tri && othertri.hasEdge(tri.c, tri.a)))
          polygon.push([tri.c, tri.a]);
      }
      for (let kt = 0; kt < badTriangles.length; ++kt) {
        let tri = badTriangles[kt];
        triangulation.splice(triangulation.indexOf(tri), 1);
      }
      polygon.forEach((edge) => triangulation.push(new Triangle(point, edge[0], edge[1])));
    }
    for (let kt = triangulation.length - 1; kt >= 0; --kt) {
      let tri = triangulation[kt];
      if (supert.includes(tri.a) || supert.includes(tri.b) || supert.includes(tri.c)) {
        triangulation.splice(kt, 1);
      }
    }
    this.triangulation = triangulation;
  }
  analyze() {
    this.points.forEach((p) => { p.tris = []; p.edges = []; });
    this.triangulation.forEach((tri) => (tri.edges = []));
    this.edgesList = new SortedArray((e0, e1) => {
      if (e0.p0.kp - e1.p0.kp) return e0.p0.kp - e1.p0.kp;
      else return e0.p1.kp - e1.p1.kp;
    });
    this.triangulation.forEach((tri) => {
      let ed = new Edge(tri.a, tri.b);
      let kedge = this.edgesList.indexOf(ed);
      if (kedge == -1) this.edgesList.doInsert(); else ed = this.edgesList.tb[kedge];
      ed.attachTriangle(tri);
      ed = new Edge(tri.b, tri.c);
      kedge = this.edgesList.indexOf(ed);
      if (kedge == -1) this.edgesList.doInsert(); else ed = this.edgesList.tb[kedge];
      ed.attachTriangle(tri);
      ed = new Edge(tri.c, tri.a);
      kedge = this.edgesList.indexOf(ed);
      if (kedge == -1) this.edgesList.doInsert(); else ed = this.edgesList.tb[kedge];
      ed.attachTriangle(tri);
    });
    this.points.forEach((p) => {
      const newEdges = [], newTris = [];
      let edge0, tri;
      if (p.tris.length != p.edges.length) {
        edge0 = p.edges.find((edge) => (edge.p0 == p && edge.tris[0] && !edge.tris[1]) || (edge.p1 == p && edge.tris[1] && !edge.tris[0]));
        if (edge0 === undefined) edge0 = p.edges[0];
      } else edge0 = p.edges[0];
      while (true) {
        newEdges.push(edge0);
        tri = edge0.tris[edge0.p0 == p ? 0 : 1];
        if (tri === undefined) break;
        newTris.push(tri);
        if (newEdges.length == p.edges.length) break;
        switch (p) {
          case tri.a: edge0 = tri.edges[2]; break;
          case tri.b: edge0 = tri.edges[0]; break;
          case tri.c: edge0 = tri.edges[1]; break;
        }
      }
      p.tris = newTris; p.edges = newEdges;
    });
  }
}

class RdPoint {
  constructor(parent, x, y) {
    this.x = x; this.y = y;
    this.kx = Math.floor((x - parent.rect.p0.x) / parent.square);
    this.ky = Math.floor((y - parent.rect.p0.y) / parent.square);
  }
  distance(p) { return Math.hypot(this.x - p.x, this.y - p.y); }
}

class RandomPoints {
  constructor(rect, dist, nbTries) {
    const genValues = (range) => {
      let currv = 0; const list = [currv]; let nbTries = 0;
      while (true) {
        let rnd = puzzle.prng();
        let futv = currv + (1 + 0.5 * rnd * rnd) * this.dist;
        if (range - futv < this.dist) {
          if (++nbTries < 10) continue; return list;
        }
        list.push(futv); currv = futv;
        if (range - currv < 2 * dist) return list;
      }
    };
    this.rect = rect; this.dist = dist; this.nbTries = nbTries;
    this.square = this.dist;
    this.nbx = Math.ceil((rect.p1.x - rect.p0.x) / this.square);
    this.nby = Math.ceil((rect.p1.y - rect.p0.y) / this.square);
    const terrain = new Array(this.nby + 1).fill(0).map(() => new Array(this.nbx + 1).fill(0).map(() => []));
    this.terrain = terrain; this.points = []; this.list = [];
    let l = genValues(rect.p1.x - rect.p0.x);
    l.forEach((v) => this.isAcceptable(new RdPoint(this, rect.p0.x + v, rect.p0.y)));
    l = genValues(rect.p1.y - rect.p0.y);
    l.forEach((v) => this.isAcceptable(new RdPoint(this, rect.p1.x, rect.p0.y + v)));
    l = genValues(rect.p1.x - rect.p0.x);
    l.forEach((v) => this.isAcceptable(new RdPoint(this, rect.p1.x - v, rect.p1.y)));
    l = genValues(rect.p1.y - rect.p0.y);
    l.forEach((v) => this.isAcceptable(new RdPoint(this, rect.p0.x, rect.p1.y - v)));
    for (let k = 0; k < this.list.length; ++k) {
      if ((this.list[k].x == rect.p0.x || this.list[k].x == rect.p1.x) && (this.list[k].y == rect.p0.y || this.list[k].y == rect.p1.y))
        this.list[k].isCorner = true; else this.list[k].isEdge = true;
    }
    while (this.list.length) {
      let posp = puzzle.prng.intAlea(this.list.length);
      let p = this.list[posp]; let found = false;
      for (let k = 0; k < nbTries; ++k) {
        let p1 = this.rndr2r(); p1 = new RdPoint(this, p.x + p1.x, p.y + p1.y);
        if (this.isAcceptable(p1)) found = true;
      }
      if (!found) this.list.splice(posp, 1);
    }
    delete this.terrain;
    this.points.forEach((p, k) => { p.kList = k; delete p.kx; delete p.ky; });
  }
  rndr2r() {
    let rnd = puzzle.prng(); rnd *= rnd;
    const r = this.dist * (1 + 0.7 * rnd);
    const th = Math.PI * puzzle.prng() * 2;
    return { x: r * Math.cos(th), y: r * Math.sin(th) };
  }
  isAcceptable(p) {
    if (p.x < this.rect.p0.x || p.x > this.rect.p1.x || p.y < this.rect.p0.y || p.y > this.rect.p1.y) return false;
    for (let kky = Math.max(0, p.ky - 1); kky <= Math.min(p.ky + 1, this.nby); ++kky) {
      for (let kkx = Math.max(0, p.kx - 1); kkx <= Math.min(p.kx + 1, this.nbx); ++kkx) {
        if (this.terrain[kky][kkx].some((pp) => p.distance(pp) < this.dist)) return false;
      }
    }
    this.terrain[p.ky][p.kx].push(p); this.list.push(p); this.points.push(p); return true;
  }
}

class Polygon {
  constructor(tr, kp, lastkp) {
    let p = (this.p = tr.points[kp]); p.polygon = this;
    if (kp <= lastkp) {
      this.vertices = []; if (p.isCorner) this.vertices.push(p);
      p.tris.forEach((tri, k) => {
        if (k == 0) this.vertices.push(p.p1);
        this.vertices.push(tri.gc);
        if (k == p.tris.length - 1) this.vertices.push(tr.points[kp == 0 ? lastkp : kp - 1].p1);
      });
      this.c = {};
      if (p.isCorner) {
        let pa = this.vertices[1];
        if (pa.x !== p.x) {
          this.c.x = (this.vertices.at(-1).x + this.vertices.at(-2).x) / 2;
          this.c.y = (this.vertices[1].y + this.vertices[2].y) / 2;
        } else {
          this.c.x = (this.vertices[1].x + this.vertices[2].x) / 2;
          this.c.y = (this.vertices.at(-1).y + this.vertices.at(-2).y) / 2;
        }
      } else {
        this.c = {
          x: (this.vertices[0].x + this.vertices[1].x + this.vertices.at(-2).x + this.vertices.at(-1).x) / 4,
          y: (this.vertices[0].y + this.vertices[1].y + this.vertices.at(-2).y + this.vertices.at(-1).y) / 4
        };
      }
    } else {
      this.vertices = p.tris.map((tri) => tri.gc);
      this.c = { x: this.vertices.reduce((s, v) => s + v.x, 0) / this.vertices.length, y: this.vertices.reduce((s, v) => s + v.y, 0) / this.vertices.length };
    }
  }
}

function makeSaveFileName(src) {
  if (typeof URL.canParse === 'function' && URL.canParse(src)) {
    src = new URL(src).pathname;
    src = src.split("/").at(-1); 
  } 
  src = src.trim();
  if (src.length == 0) src = "save";
  let lsti = src.lastIndexOf(".");
  if (lsti != -1) src = src.substring(0, lsti);
  src = src.trim();
  if (src.length == 0) src = "save";
  let nname = "";
  for (let k = 0; k < src.length; ++k) {
    const c = src.charAt(k);
    if ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-".indexOf(c) != -1)
      nname += c;
    else nname += "_";
  }
  ui.saveas.value = nname;
  return nname;
} 

function startGame() {
  events.push({ event: "nbpieces", nbpieces: Number(ui.nbpieces.value) });
}
function confirmStop() {
  if (!playing) return; 
  new Modal({
    lines: ["Are you sure you want to stop this game ?"],
    buttons: [
      { text: "stop", callback: () => events.push({ event: "stop" }) },
      { text: "continue" }
    ]
  });
}
const helptext = [
  "Thank you for playing my jigsaw puzzle game.",
  "You can play with a default picture, or load any jpeg, png or other kind of picture from your computer.",
  "Pick a rotation step for the pieces, from none to 12 steps by turn. Rotate the pieces by clicking/tapping them. Pieces will rotate counter-clockwise if the shift key is held down during rotation.",
  "Choose from the different piece shapes available.",
  "Choose the number of pieces. This is not an accurate value, depending on the dimensions of your picture, the exact number of pieces may be slightly different.",
  "You can zoom in and out with the mouse wheel or by pinching, or with the keyboard keys Ctrl + and Ctrl -.",
  "You can move the whole game at a time in any direction by touching the surface outside of any piece, and moving around. Combined with the zoom feature, this gives you access to a virtually unlimited game area.",
  "Last, you can save a game in progress, and restore it later. Two methods are proposed, see individual help buttons for details."
];

const helpstoragetext = [
  "With this method, the game is saved in your browser's data.",
  "This method is fast - really a one-click action - but with a few drawbacks.",
  "Although it is very popular, this method is not available on some devices.",
  "Only one game can be saved at a time: every saved game replaces the previous one.",
  "Furthermore, this method can fail, with locally loaded images bigger than a few Mb. A message will be issued in case of failure"
];

const helpfiletext = [
  'This method stores the saved game in your download folder. Use the "save name" field to save different games with different names.',
  "On some devices, you are not limited to the download folder: you will be prompted for the destination folder and name."
];

function getTransformMatrix(orgx, orgy, scale, rot, destx, desty) {
  const mat = new DOMMatrix([1, 0, 0, 1, destx, desty]);
  if (rot) mat.multiplySelf(puzzle.rotMat[rot]);
  mat.scaleSelf(scale, scale);
  return mat.translateSelf(-orgx, -orgy);
} 

class Side {
  constructor(type, points) {
    this.type = type || ""; 
    this.points = points || []; 
  } 
  reversed() {
    const ns = new Side();
    ns.type = this.type;
    ns.points = this.points.slice().reverse();
    return ns;
  } 
  drawNormPath(path, first) {
    if (first) path.moveTo(this.points[0].x, this.points[0].y);
    if (this.type == "d") {
      path.lineTo(this.points[1].x, this.points[1].y);
    } else {
      for (let k = 1; k < this.points.length - 1; k += 3) {
        path.bezierCurveTo(this.points[k].x, this.points[k].y, this.points[k + 1].x, this.points[k + 1].y, this.points[k + 2].x, this.points[k + 2].y);
      }
    }
  }
}
function twist0(side, ca) {
  const sp = side.points;
  const dxh = sp[1].x - sp[0].x, dyh = sp[1].y - sp[0].y;
  const lsegh = Math.hypot(dxh, dyh);
  if (lsegh < puzzle.distPoints * 0.4) return;
  const mid0 = lerp(sp[0], sp[1], 0.5);
  const dxv = ca.x - mid0.x, dyv = ca.y - mid0.y;
  const lsegv = Math.hypot(dxv, dyv);
  let scalev = puzzle.prng.alea(1.5, 2);
  const scaleh = puzzle.prng.alea(1, 1.3);
  const alpha = 2;
  if (scalev * lsegv > alpha * scaleh * lsegh) scalev = (alpha * scaleh * lsegh) / lsegv;
  if (scalev * lsegv < 0.5 * scaleh * lsegh) return;
  const mid = puzzle.prng.alea(0.45, 0.55);
  const pointAt = (coeffh, coeffv) => ({ x: sp[0].x + coeffh * dxh + coeffv * dxv, y: sp[0].y + coeffh * dyh + coeffv * dyv });
  const pa = pointAt(mid - (1 / 12) * scaleh, (1 / 12) * scalev), pb = pointAt(mid - (1.8 / 12) * scaleh, (2.8 / 12) * scalev);
  const pc = pointAt(mid, (4 / 12) * scalev), pd = pointAt(mid + (1.8 / 12) * scaleh, (2.8 / 12) * scalev), pe = pointAt(mid + (1 / 12) * scaleh, (1 / 12) * scalev);
  side.points = [sp[0], { x: sp[0].x + (5 / 12) * dxh * 0.52, y: sp[0].y + (5 / 12) * dyh * 0.52 }, { x: pa.x - (1 / 12) * dxv * 0.72, y: pa.y - (1 / 12) * dyv * 0.72 }, pa, { x: pa.x + (2 / 12) * dxv * 0.92, y: pa.y + (2 / 12) * dyv * 0.92 }, { x: pb.x - (1 / 12) * dxv * 0.92, y: pb.y - (1 / 12) * dyv * 0.92 }, pb, { x: pb.x + (1 / 12) * dxv * 0.92, y: pb.y + (1 / 12) * dyv * 0.92 }, { x: pc.x - (2 / 12) * dxh * 0.7, y: pc.y - (2 / 12) * dyh * 0.7 }, pc, { x: pc.x + (2 / 12) * dxh * 0.7, y: pc.y + (2 / 12) * dyh * 0.7 }, { x: pd.x + (1 / 12) * dxv * 0.92, y: pd.y + (1 / 12) * dyv * 0.92 }, pd, { x: pd.x - (1 / 12) * dxv * 0.92, y: pd.y - (1 / 12) * dyv * 0.92 }, { x: pe.x + (2 / 12) * dxv * 0.92, y: pe.y + (2 / 12) * dyv * 0.92 }, pe, { x: pe.x - (1 / 12) * dxv * 0.72, y: pe.y - (1 / 12) * dyv * 0.72 }, { x: sp[1].x - (5 / 12) * dxh * 0.52, y: sp[1].y - (5 / 12) * dyh * 0.52 }, sp[1]];
  side.type = "z";
}
function twist1(side, ca) {
  const sp = side.points;
  const dxh = sp[1].x - sp[0].x, dyh = sp[1].y - sp[0].y;
  if (Math.hypot(dxh, dyh) < puzzle.distPoints * 0.4) return;
  const mid0 = lerp(sp[0], sp[1], 0.5);
  const dxv = ca.x - mid0.x, dyv = ca.y - mid0.y;
  const pointAt = (coeffh, coeffv) => ({ x: sp[0].x + coeffh * dxh + coeffv * dxv, y: sp[0].y + coeffh * dyh + coeffv * dyv });
  const pa = pointAt(puzzle.prng.alea(0.15, 0.35), puzzle.prng.alea(-0.05, 0.05));
  const pb = pointAt(puzzle.prng.alea(0.45, 0.55), puzzle.prng.alea(0.3, 0.5));
  const pc = pointAt(puzzle.prng.alea(0.65, 0.85), puzzle.prng.alea(-0.05, 0.05));
  side.points = [sp[0], sp[0], pa, pa, pa, pb, pb, pb, pc, pc, pc, sp[1], sp[1]];
  side.type = "z";
}
function twist2(side, ca) {
  const sp = side.points;
  const dxh = sp[1].x - sp[0].x, dyh = sp[1].y - sp[0].y;
  const mid0 = lerp(sp[0], sp[1], 0.5);
  const dxv = ca.x - mid0.x, dyv = ca.y - mid0.y;
  const pointAt = (coeffh, coeffv) => ({ x: sp[0].x + coeffh * dxh + coeffv * dxv, y: sp[0].y + coeffh * dyh + coeffv * dyv });
  const hmid = puzzle.prng.alea(0.45, 0.55);
  const vmid = puzzle.prng.alea(0.4, 0.5);
  const pc = pointAt(hmid, vmid);
  const pb = lerp(sp[0], pc, 2 / 3);
  const pd = lerp(sp[1], pc, 2 / 3);
  side.points = [sp[0], pb, pd, sp[1]];
  side.type = "z";
}
function twist3() {}
function twist4(side, ca, cb) {
  const sp = side.points;
  const pa0 = lerp(sp[0], ca, 0.13), pa1 = lerp(sp[1], ca, 0.13), pb0 = lerp(sp[0], cb, 0.13), pb1 = lerp(sp[1], cb, 0.13);
  side.points = [sp[0], lerp(sp[0], sp[1], 0.25), lerp(pa0, pa1, 0.33 - 0.1), lerp(pa0, pa1, 0.33), lerp(pa0, pa1, 0.33 + 0.1), lerp(pb0, pb1, 0.67 - 0.1), lerp(pb0, pb1, 0.67), lerp(pb0, pb1, 0.67 + 0.1), lerp(sp[1], sp[0], 0.25), sp[1]];
  side.type = "z";
}

class PolyPiece {
  constructor(initialPiece) {
    this.pieces = [initialPiece]; initialPiece.poly = this; this.selected = false;
    this.minx = initialPiece.minx; this.maxx = initialPiece.maxx;
    this.miny = initialPiece.miny; this.maxy = initialPiece.maxy;
    this.pCentre = { x: (this.minx + this.maxx) / 2, y: (this.miny + this.maxy) / 2 };
    this.diagonal = Math.hypot(this.maxx - this.minx, this.maxy - this.miny);
    this.listLoops(); this.getSrcPath(); this.getNormIntPath(); this.rot = 0;
  }
  merge(otherPoly) {
    const kOther = puzzle.polyPieces.indexOf(otherPoly);
    puzzle.polyPieces.splice(kOther, 1);
    for (let k = 0; k < otherPoly.pieces.length; ++k) {
      otherPoly.pieces[k].poly = this; this.pieces.push(otherPoly.pieces[k]);
    }
    if (otherPoly.minx < this.minx) this.minx = otherPoly.minx;
    if (otherPoly.maxx > this.maxx) this.maxx = otherPoly.maxx;
    if (otherPoly.miny < this.miny) this.miny = otherPoly.miny;
    if (otherPoly.maxy > this.maxy) this.maxy = otherPoly.maxy;
    this.pCentre = { x: (this.minx + this.maxx) / 2, y: (this.miny + this.maxy) / 2 };
    this.diagonal = Math.hypot(this.maxx - this.minx, this.maxy - this.miny);
    this.listLoops(); this.getSrcPath(); this.getNormIntPath();
    puzzle.evaluateOrder();
  }
  ifNear(otherPoly) {
    if (this.rot != otherPoly.rot) return false;
    if (Math.hypot(this.x - otherPoly.x, this.y - otherPoly.y) >= puzzle.dConnect) return false;
    const sides = this.tbLoops.flat(), sides1 = otherPoly.tbLoops.flat();
    for (let ks = 0; ks < sides1.length; ++ks) {
      const sd = sides1[ks]; if (sides.find((es) => es.points[0] == sd.points.at(-1))) return true;
    }
    return false;
  }
  listLoops() {
    const tbLoops = [], tbEdges = []; let lp, currEdge, edgeNumber;
    this.pieces.forEach((pc1) => {
      pc1.sides.forEach((side, k) => {
        if (side.polys.length == 2) {
          let other = side.polys[0] == pc1 ? side.polys[1] : side.polys[0];
          if (other?.poly == this) return;
        }
        tbEdges.push(pc1.sideLines[k]);
      });
    });
    while (tbEdges.length > 0) {
      lp = []; currEdge = tbEdges.shift(); lp.push(currEdge);
      do {
        edgeNumber = tbEdges.findIndex((ed) => ed.points[0] == currEdge.points.at(-1));
        if (edgeNumber == -1) break; currEdge = tbEdges.splice(edgeNumber, 1)[0]; lp.push(currEdge);
      } while (1);
      tbLoops.push(lp);
    }
    this.tbLoops = tbLoops;
  }
  getSrcPath() {
    this.srcPath = new Path2D(); let pth;
    this.tbLoops.forEach((loop) => {
      pth = new Path2D(); loop.forEach((side, k) => side.drawNormPath(pth, k == 0));
      this.srcPath.addPath(pth);
    });
    return this.srcPath;
  }
  getNormIntPath() {
    this.normIntPath = new Path2D(); let edg = this.tbLoops.flat();
    this.pieces.forEach((pc) => {
      pc.sides.forEach((side, kk) => {
        if (edg.includes(pc.sideLines[kk])) return;
        if (pc == side.polys[0]) side.drawNormPath(this.normIntPath, true);
      });
    });
    return this.normIntPath;
  }
  setTransforms() {
    this.fromSrcMatrix = getTransformMatrix(0, 0, puzzle.scale, this.rot, this.x, this.y);
  }
  drawImage(special) {
    this.setTransforms(); let pth = new Path2D(); pth.addPath(this.srcPath, this.fromSrcMatrix); this.playPath = pth;
    let pa = this.fromSrcMatrix.transformPoint({ x: this.minx - this.diagonal / 2, y: this.miny - this.diagonal / 2 });
    let pb = this.fromSrcMatrix.transformPoint({ x: this.maxx + this.diagonal / 2, y: this.maxy + this.diagonal / 2 });
    if (Math.max(pa.x, pb.x) < 0 || Math.max(pa.y, pb.y) < 0 || Math.min(pa.x, pb.x) > puzzle.contWidth || Math.min(pa.y, pb.y) > puzzle.contHeight) return;
    let ctx = puzzle.playCtx; if (this.isMoving) { ctx = puzzle.moveCtx; ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
    ctx.strokeStyle = "#000"; ctx.fillStyle = "none";
    ctx.shadowColor = this.selected ? (special ? "lime" : "gold") : "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = this.selected ? Math.min(8, (puzzle.distPoints * puzzle.scale) / 10) : 4;
    ctx.shadowOffsetX = this.selected ? 0 : -4; ctx.shadowOffsetY = this.selected ? 0 : 4;
    ctx.fill(pth); if (this.selected) for (let k = 0; k < 6; ++k) ctx.fill(pth); ctx.shadowColor = "rgba(0, 0, 0, 0)";
    ctx.save(); ctx.clip(pth); ctx.setTransform(this.fromSrcMatrix); ctx.drawImage(puzzle.srcImage, 0, 0); ctx.resetTransform();
    const dxemboss = puzzle.embossThickness / 2, dyemboss = -puzzle.embossThickness / 2;
    if (puzzle.drawMode == 3) {
      ctx.restore();
      this.pieces.forEach((pc) => {
        let pthi = new Path2D(); pthi.addPath(pc.srcPath, this.fromSrcMatrix);
        ctx.save(); ctx.clip(pthi); drawEmboss(ctx, pthi); ctx.restore();
      });
    } else { drawEmboss(ctx, pth); if (puzzle.drawMode == "1") drawInternal(ctx, this); ctx.restore(); }
    function drawEmboss(ctx, path) {
      ctx.lineWidth = puzzle.embossThickness * 1.5; ctx.translate(dxemboss, dyemboss); ctx.strokeStyle = "rgba(0, 0, 0, 0.35)"; ctx.stroke(path);
      ctx.translate(-2 * dxemboss, -2 * dyemboss); ctx.strokeStyle = "rgba(255, 255, 255, 0.35)"; ctx.stroke(path);
    }
    function drawInternal(ctx, pp) {
      let pth = new Path2D(); pth.addPath(pp.normIntPath, pp.fromSrcMatrix);
      ctx.lineWidth = 1; ctx.strokeStyle = "#ffffff"; let sv = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "difference"; ctx.stroke(pth); ctx.globalCompositeOperation = "sv";
    }
  }
  moveTo(x, y) { this.x = x; this.y = y; this.setTransforms(); }
  rotate(angle) {
    let pCenterDisp = this.fromSrcMatrix.transformPoint(this.pCentre); this.rot = angle;
    const mtrx = getTransformMatrix(this.pCentre.x, this.pCentre.y, puzzle.scale, this.rot, pCenterDisp.x, pCenterDisp.y);
    this.x = mtrx.e; this.y = mtrx.f;
  }
  isPointInPath(p) { return puzzle.playCtx.isPointInPath(this.playPath, p.x, p.y); }
}

class Puzzle {
  constructor(params) {
    this.autoStart = false; this.container = typeof params.container == "string" ? document.getElementById(params.container) : params.container;
    this.container.addEventListener("mousedown", (event) => {
      useMouse = true; event.preventDefault(); if (event.button != 0) return;
      events.push({ event: "touch", position: this.relativeMouseCoordinates(event) });
    });
    this.container.addEventListener("touchstart", (event) => {
      useMouse = false; event.preventDefault(); if (event.touches.length == 0) return;
      const rTouch = []; for (let k = 0; k < event.touches.length; ++k) rTouch[k] = this.relativeMouseCoordinates(event.touches.item(k));
      if (event.touches.length == 1) events.push({ event: "touch", position: rTouch[0] });
      if (event.touches.length == 2) events.push({ event: "touches", touches: rTouch });
    }, { passive: false });
    this.container.addEventListener("mouseup", (event) => {
      useMouse = true; event.preventDefault(); if (event.button != 0) return; handleLeave(event);
    });
    this.container.addEventListener("touchend", handleLeave);
    this.container.addEventListener("touchleave", handleLeave);
    this.container.addEventListener("touchcancel", handleLeave);
    this.container.addEventListener("mousemove", (event) => {
      useMouse = true; event.preventDefault();
      if (events.length && events[events.length - 1].event == "move") events.pop();
      events.push({ event: "move", position: this.relativeMouseCoordinates(event), ev: event });
    });
    this.container.addEventListener("touchmove", (event) => {
      useMouse = false; event.preventDefault(); if (event.touches.length == 0) return;
      const rTouch = []; for (let k = 0; k < event.touches.length; ++k) rTouch[k] = this.relativeMouseCoordinates(event.touches.item(k));
      if (event.touches.length == 1) {
        if (events.length && events[events.length - 1].event == "move") events.pop();
        events.push({ event: "move", position: rTouch[0] });
      }
      if (event.touches.length == 2) {
        if (events.length && events[events.length - 1].event == "moves") events.pop();
        events.push({ event: "moves", touches: rTouch });
      }
    }, { passive: false });
    this.container.addEventListener("wheel", (event) => {
      useMouse = true; event.preventDefault(); if (events.length && events.at(-1).event == "wheel") events.pop();
      events.push({ event: "wheel", wheel: event });
    });
    const KDINSTALLED = "kdinstalledcct5874"; 
    if (!(KDINSTALLED in document.body.dataset)) {
      document.body.addEventListener("keydown", (event) => {
        if ((event.key != "+" && event.key != "-") || !event.shiftKey) return; 
        event.preventDefault(); if (events.length && events.at(-1).event == "wheel") events.pop();
        events.push({ event: "wheel", wheel: { deltaY: event.key == "+" ? 1 : -1 }, center: { x: puzzle.contWidth / 2, y: puzzle.contHeight / 2 } });
      });
      document.body.dataset[KDINSTALLED] = "1";
    }
    this.srcImage = new Image(); this.imageLoaded = false;
    this.srcImage.addEventListener("load", () => imageLoaded());
    function handleLeave(event) { events.push({ event: "leave", shiftKey: event.shiftKey }); }
  }
  getContainerSize() {
    let styl = window.getComputedStyle(this.container);
    this.contWidth = parseFloat(styl.width); this.contHeight = parseFloat(styl.height);
  }
  showImage(state) {
    puzzle.showState = state == undefined ? !puzzle.showState : !!state;
    let showElem = puzzle.container.querySelector(".showimage");
    if (!showElem) {
      showElem = document.createElement("div"); showElem.classList.add("showimage");
      showElem.addEventListener("click", () => puzzle.showImage(false));
      puzzle.container.append(showElem);
    }
    showElem.innerHTML = "";
    if (puzzle.showState) {
      ui.close(); showElem.style.display = "block";
      let img = document.createElement("img"); showElem.append(img); img.src = puzzle.srcImage.src;
    } else showElem.style.display = "none";
  }

  create(baseData) {
    this.prng = mMash(baseData ? baseData[2] : "a"); this.container.innerHTML = "";
    this.playCanvas = document.createElement("canvas"); this.container.append(this.playCanvas);
    this.playCtx = this.playCanvas.getContext("2d"); this.playCanvas.style.position = "absolute";
    this.moveCanvas = document.createElement("canvas"); this.container.append(this.moveCanvas);
    this.moveCtx = this.moveCanvas.getContext("2d"); this.moveCanvas.style.position = "absolute";
    this.getContainerSize(); this.moveCanvas.width = this.playCanvas.width = this.contWidth;
    this.moveCanvas.height = this.playCanvas.height = this.contHeight;
    if (baseData) {
      this.typeOfShape = baseData[4]; ui.shape.value = Number(baseData[3]) + 1;
      this.distPoints = baseData[0]; this.scale = baseData[1]; this.rotationStep = baseData[3];
      ui.rotationstep.value = this.rotationStep; this.makePolygons();
    } else {
      this.typeOfShape = document.getElementById("shape").value - 1;
      this.distPoints = Math.sqrt(this.srcWidth * this.srcHeight) / 10;
      this.rotationStep = parseInt(ui.rotationstep.value, 10);
      do {
        this.prng = mMash(); this.makePolygons();
        if (Math.abs(1 - this.pieces.length / this.nbPieces) <= 0.01 || Math.abs(this.pieces.length - this.nbPieces) <= 2) break;
        this.distPoints *= Math.max(0.67, Math.min(1.5, Math.sqrt(this.pieces.length / this.nbPieces)));
      } while (true);
    }
    this.nbPiecesAct = this.pieces.length; this.rotMat = MATS[this.rotationStep];
    this.nbRot = [, 2, 3, 4, 6, 8, 12][this.rotationStep];
    this.pieces.forEach((piece) => {
      piece.minx = piece.vertices.reduce((min, vert) => Math.min(min, vert.x), Infinity);
      piece.maxx = piece.vertices.reduce((max, vert) => Math.max(max, vert.x), -Infinity);
      piece.miny = piece.vertices.reduce((min, vert) => Math.min(min, vert.y), Infinity);
      piece.maxy = piece.vertices.reduce((max, vert) => Math.max(max, vert.y), -Infinity);
    });
    this.defineShapes({ coeffDecentr: 0.12, twistf: [twist0, twist1, twist2, twist3, twist4][this.typeOfShape] });
    this.polyPieces = [];
    if (!baseData) {
      this.pieces.forEach((piece) => this.polyPieces.push(new PolyPiece(piece, this)));
      arrayShuffle(this.polyPieces);
      if (this.rotationStep) puzzle.polyPieces.forEach((pp) => (pp.rot = intAlea(this.nbRot)));
    } else {
      const pps = baseData[7], offs = this.rotationStep ? 3 : 2;
      pps.forEach((ppData) => {
        let polyp = new PolyPiece(this.pieces[ppData[offs]]);
        polyp.x = ppData[0]; polyp.y = ppData[1]; polyp.rot = this.rotationStep ? ppData[2] : 0;
        for (let k = offs + 1; k < ppData.length; k++) {
          polyp.pieces.push(this.pieces[ppData[k]]); this.pieces[ppData[k]].poly = polyp;
          if (this.pieces[ppData[k]].minx < polyp.minx) polyp.minx = this.pieces[ppData[k]].minx;
          if (this.pieces[ppData[k]].maxx > polyp.maxx) polyp.maxx = this.pieces[ppData[k]].maxx;
          if (this.pieces[ppData[k]].miny < polyp.miny) polyp.miny = this.pieces[ppData[k]].miny;
          if (this.pieces[ppData[k]].maxy > polyp.maxy) polyp.maxy = this.pieces[ppData[k]].maxy;
        }
        polyp.pCentre = { x: (polyp.minx + polyp.maxx) / 2, y: (polyp.miny + polyp.maxy) / 2 };
        polyp.listLoops(); polyp.getSrcPath(); polyp.getNormIntPath(); this.polyPieces.push(polyp);
      });
    }
    this.evaluateOrder();
  }
  drawPolyPieces(butTop) {
    this.playCtx.clearRect(0, 0, this.playCanvas.width, this.playCanvas.height);
    let max = this.polyPieces.length - (butTop ? 1 : 0);
    for (let k = 0; k < max; ++k) this.polyPieces[k].drawImage();
  }
  defineShapes(shapeDesc) {
    let { twistf } = shapeDesc;
    for (const piece of this.pieces) {
      piece.sideLines = [];
      piece.sides.forEach((side, k) => {
        if (!side.processed) {
          if (side.polys.length == 2) {
            let cs = [side.polys[0].c, side.polys[1].c]; if (this.prng.intAlea(2)) cs = [cs[1], cs[0]];
            twistf(side, cs[0], cs[1]); side.processed = true;
          }
        }
        piece.sideLines[k] = side.points[0] == piece.vertices[k] ? side : side.reversed();
      });
      piece.srcPath = new Path2D(); piece.sideLines.forEach((sln, k) => sln.drawNormPath(piece.srcPath, k == 0));
      piece.srcPath.closePath();
    }
  }
  doScale() {
    this.dConnect = Math.max(10, (this.scale * this.distPoints) / 10);
    this.embossThickness = Math.min(2 + ((this.scale * this.distPoints) / 200) * (4 - 2), 4);
    this.polyPieces.forEach((pp) => pp.setTransforms());
  }
  sweepBy(dx, dy) { this.polyPieces.forEach((pp) => pp.moveTo(pp.x + dx, pp.y + dy)); this.drawPolyPieces(); }
  zoomBy(coef, center) {
    let futWidth = this.srcWidth * this.scale * coef, futHeight = this.srcHeight * this.scale * coef;
    let nsize = Math.sqrt((futWidth * futWidth) / this.pieces.length);
    if (((nsize > 1000 || futWidth > 10000 || futHeight > 10000) && coef > 1) || (nsize < 10 && coef < 1) || coef == 1) return;
    this.scale *= coef; this.doScale(); this.polyPieces.forEach((pp) => pp.moveTo(coef * (pp.x - center.x) + center.x, coef * (pp.y - center.y) + center.y));
    this.drawPolyPieces();
  }
  relativeMouseCoordinates(event) {
    const br = this.container.getBoundingClientRect(); lastMousePos = { x: event.clientX - br.x, y: event.clientY - br.y };
    return lastMousePos;
  }
  spread() {
    let kSpread = 1.7, kMargin = 1.7, gstep = this.distPoints * kSpread;
    let ngx = Math.ceil((2 * kMargin * this.distPoints + this.srcWidth) / gstep);
    let ngy = Math.ceil((2 * kMargin * this.distPoints + this.srcHeight) / gstep);
    let nTotCells = this.nbPiecesAct + ngx * ngy;
    let nmaxx = Math.ceil(nTotCells / ngy) + 2, nmaxy = Math.ceil(nTotCells / ngx) + 2;
    let bestk = { cellSize: 0 }, cellSize;
    for (let nbx = ngx; nbx < nmaxx; ++nbx) {
      let nby = Math.max(ngy, Math.ceil(nTotCells / nbx)); cellSize = Math.min(this.contWidth / nbx, this.contHeight / nby);
      if (cellSize > bestk.cellSize) { bestk.cellSize = cellSize; bestk.nbx = nbx; bestk.nby = nby; }
    }
    for (let nby = ngy; nby < nmaxy; ++nby) {
      let nbx = Math.max(ngx, Math.ceil(nTotCells / nby)); cellSize = Math.min(this.contWidth / nbx, this.contHeight / nby);
      if (cellSize > bestk.cellSize) { bestk.cellSize = cellSize; bestk.nbx = nbx; bestk.nby = nby; }
    }
    this.scale = bestk.cellSize / this.distPoints / kSpread;
    let col0 = Math.floor((bestk.nbx - ngx) / 2), col1 = col0 + ngx - 1, row0 = Math.floor((bestk.nby - ngy) / 2), row1 = row0 + ngy - 1;
    let offsx = (this.contWidth - bestk.nbx * bestk.cellSize) / 2, offsy = (this.contHeight - bestk.nby * bestk.cellSize) / 2;
    let idxpc = 0;
    loopSpr: for (let ky = 0; ky < bestk.nby; ++ky) {
      for (let kx = 0; kx < bestk.nbx; ++kx) {
        if (kx >= col0 && kx <= col1 && ky >= row0 && ky <= row1) continue;
        let pp = this.polyPieces[idxpc++];
        this.fromSrcMatrix = getTransformMatrix(pp.pCentre.x, pp.pCentre.y, puzzle.scale, pp.rot, offsx + (kx + 0.5) * bestk.cellSize, offsy + (ky + 0.5) * bestk.cellSize);
        pp.x = this.fromSrcMatrix.e; pp.y = this.fromSrcMatrix.f;
        if (idxpc >= this.nbPiecesAct) break loopSpr;
      }
    }
  }
  evaluateOrder() {
    for (let k = this.polyPieces.length - 1; k > 0; --k) {
      if (this.polyPieces[k].pieces.length > this.polyPieces[k - 1].pieces.length)
        [this.polyPieces[k], this.polyPieces[k - 1]] = [this.polyPieces[k - 1], this.polyPieces[k]];
    }
  }
  getStateData() {
    let saved = { signature: fileSignature };
    if ("origin" in this.srcImage.dataset) saved.origin = this.srcImage.dataset.origin;
    saved.src = this.srcImage.src;
    let base = [this.distPoints, this.scale, this.prng.seed, this.rotationStep, this.typeOfShape, this.srcWidth, this.srcHeight];
    saved.base = base; let pps = []; base.push(pps);
    this.polyPieces.forEach((pp) => {
      let ppData = [Math.round(pp.x), Math.round(pp.y)]; if (this.rotationStep) ppData.push(pp.rot);
      pp.pieces.forEach((p) => ppData.push(this.pieces.indexOf(p))); pps.push(ppData);
    });
    return saved;
  }
  makePolygons() {
    const distPoints = this.distPoints; let tr, polygons, t, points;
    tryagain: do {
      t = new RandomPoints({ p0: { x: 0, y: 0 }, p1: { x: this.srcWidth, y: this.srcHeight } }, distPoints, 30);
      points = generatePoints(t); tr = new Delaunay(points, t.rect); tr.analyze(); tr.triangulation.forEach((tri) => tri.listTris());
      for (let ktri = 0; ktri < tr.triangulation.length; ++ktri) {
        let tri = tr.triangulation[ktri]; if (tri.tris.flat(0).length != 3) {
          let cnt = 0; if (tri.a.isCorner || tri.a.isEdge) ++cnt; if (tri.b.isCorner || tri.b.isEdge) ++cnt; if (tri.c.isCorner || tri.c.isEdge) ++cnt;
          if (cnt < 2) continue tryagain;
        }
      }
      break;
    } while (true);
    tr.triangulation.forEach((tri) => tri.gc = { x: (tri.a.x + tri.b.x + tri.c.x) / 3, y: (tri.a.y + tri.b.y + tri.c.y) / 3 });
    let lastkp;
    for (let kp = 0, side = 0; tr.points[kp]?.isEdge || tr.points[kp]?.isCorner; ++kp) {
      if (tr.points[kp].isCorner) side = 1 - side;
      let tri = tr.points[kp].tris[0]; let np = tr.points[kp + 1]; if (!np?.isEdge && !np?.isCorner) np = tr.points[0];
      tr.points[kp].p1 = side ? { x: tri.gc.x, y: tr.points[kp].y } : { x: tr.points[kp].x, y: tri.gc.y };
      lastkp = kp;
    }
    polygons = []; tr.points.forEach((p, k) => polygons.push(new Polygon(tr, k, lastkp)));
    polygons.forEach((poly) => {
      let side, side1; const nVert = poly.vertices.length; poly.sides = [];
      for (let k = 0; k < nVert; ++k) {
        let p0 = poly.vertices[k], p1 = poly.vertices[(k + 1) % nVert]; side = new Side("d", [p0, p1]); side.polys = [poly];
        if ((p0.isCorner || p0.isEdge) && (p1.isCorner || p1.isEdge)) { side.isEdge = true; poly.isEdge = true; }
        else {
          if (p0.sides) side1 = p0.sides.find((ed) => (ed.points[0] == p0 && ed.points[1] == p1) || (ed.points[0] == p1 && ed.points[1] == p0));
          if (side1 != undefined) { side = side1; side.polys.push(poly); }
          else { p0.sides = p0.sides || []; p0.sides.push(side); p1.sides = p1.sides || []; p1.sides.push(side); }
        }
        poly.sides[k] = side;
      }
    });
    polygons.forEach((poly) => {
      poly.neighbors = new Set(); poly.sides.forEach((side) => {
        side.polys.forEach((pp) => poly.neighbors.add(pp));
        poly.neighbors.delete(poly);
      });
    });
    this.pieces = polygons;
  }
}

let events = [];

function imageLoaded() {
  puzzle.imageLoaded = true; puzzle.srcWidth = puzzle.srcImage.width; puzzle.srcHeight = puzzle.srcImage.height;
  if (puzzle.autoStart) startGame(); else ui.waiting();
}

function loadInitialFile() {
  puzzle.srcImage.src = "https://picsum.photos/id/237/800/600";
  puzzle.srcImage.dataset.origin = "default";
  makeSaveFileName(puzzle.srcImage.src);
}

function loadFile() {
  let input = document.createElement("input"); input.type = "file"; input.accept = "image/*";
  input.addEventListener("change", (event) => {
    if (event.target.files.length > 0) {
      let file = event.target.files[0]; let reader = new FileReader();
      reader.onload = (e) => {
        puzzle.srcImage.src = e.target.result; puzzle.srcImage.dataset.origin = "local";
        makeSaveFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  });
  input.click();
}

function loadSaved() {
  let input = document.createElement("input"); input.type = "file"; input.accept = fileExtension;
  input.addEventListener("change", (event) => {
    if (event.target.files.length > 0) {
      let file = event.target.files[0]; let reader = new FileReader();
      reader.onload = (e) => {
        try {
          let saved = JSON.parse(e.target.result);
          if (saved.signature != fileSignature) throw "not a puzzle file";
          events.push({ event: "restore", data: saved });
        } catch (e) { popup(["This is not a valid saved game file"]); }
      };
      reader.readAsDataURL(file);
    }
  });
  input.click();
}

function animate() {
  requestAnimationFrame(animate);
  if (events.length > 0) {
    let ev = events.shift();
    switch (ev.event) {
      case "nbpieces":
        puzzle.nbPieces = ev.nbpieces; puzzle.create(); puzzle.spread(); puzzle.doScale(); playing = true; ui.playing(); break;
      case "stop":
        playing = false; puzzle.create(); ui.waiting(); break;
      case "touch":
        if (!playing) break;
        for (let k = puzzle.polyPieces.length - 1; k >= 0; --k) {
          if (puzzle.polyPieces[k].isPointInPath(ev.position)) {
            let pp = puzzle.polyPieces.splice(k, 1)[0]; puzzle.polyPieces.push(pp); pp.isMoving = true; pp.selected = true;
            pp.offx = ev.position.x - pp.x; pp.offy = ev.position.y - pp.y;
            puzzle.drawPolyPieces(true); pp.drawImage(); break;
          }
        }
        break;
      case "move":
        if (!playing) {
          if (lastMousePos) {
            puzzle.sweepBy(ev.position.x - lastMousePos.x, ev.position.y - lastMousePos.y);
            lastMousePos = ev.position;
          }
          break;
        }
        let pp = puzzle.polyPieces.at(-1);
        if (pp?.isMoving) {
          pp.moveTo(ev.position.x - pp.offx, ev.position.y - pp.offy); pp.drawImage();
        } else if (lastMousePos) {
          puzzle.sweepBy(ev.position.x - lastMousePos.x, ev.position.y - lastMousePos.y);
          lastMousePos = ev.position;
        }
        break;
      case "leave":
        if (!playing) { lastMousePos = null; break; }
        let pp2 = puzzle.polyPieces.at(-1);
        if (pp2?.isMoving) {
          pp2.isMoving = false;
          if (puzzle.rotationStep && !pp2.moved) {
            pp2.rotate((pp2.rot + (ev.shiftKey ? puzzle.nbRot - 1 : 1)) % puzzle.nbRot);
          }
          puzzle.drawPolyPieces();
          for (let k = puzzle.polyPieces.length - 2; k >= 0; --k) {
            if (pp2.ifNear(puzzle.polyPieces[k])) { pp2.merge(puzzle.polyPieces[k]); puzzle.drawPolyPieces(); }
          }
          if (puzzle.polyPieces.length == 1) {
            playing = false; ui.waiting();
            popup(["Congratulations!", "You solved the puzzle!"]);
          }
        }
        lastMousePos = null; break;
      case "wheel":
        let center = ev.center || ev.wheel;
        puzzle.zoomBy(ev.wheel.deltaY > 0 ? 1.1 : 0.9, center); break;
      case "save":
        let data = JSON.stringify(puzzle.getStateData());
        if (ev.file) saveFile(data, ui.saveas.value + fileExtension);
        else {
          try { localStorage.setItem("puzzle_save", data); popup(["Game saved in browser storage."]); }
          catch (e) { popup(["Failed to save in browser storage.", "Your image might be too big."]); }
        }
        break;
      case "restore":
        let saved;
        if (ev.data) saved = ev.data;
        else {
          let s = localStorage.getItem("puzzle_save");
          if (!s) { popup(["No saved game found in browser storage."]); break; }
          saved = JSON.parse(s);
        }
        puzzle.autoStart = true; puzzle.srcImage.src = saved.src; 
        puzzle.srcImage.addEventListener("load", () => {
          puzzle.create(saved.base); puzzle.doScale(); playing = true; ui.playing();
          puzzle.autoStart = false;
        }, { once: true });
        break;
    }
  }
}

window.addEventListener("load", () => {
  prepareUI(); puzzle = new Puzzle({ container: "forPuzzle" });
  loadInitialFile(); animate();
});
