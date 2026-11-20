// The Muna Cave world ("Tangan di Antara Ayam"):
// 1. Tropical karst coast with dark cave mouth (Shot 1)
// 2. Liang Metanduno cave chamber with authentic petroglyphs: rooster, horse rider, and the 67,800-year-old hand stencil (Shots 2, 3, 4, 8, 9)
// 3. Ancient flashback with firelight, hand pressed, and red pigment spray (Shot 5)
// 4. Geological cross-section diagram with laser ablation dating (Shots 6, 7)
import * as THREE from "three";
import { Batch, V, lam, boxGeo, quad, Kit } from "./build";
import { ctex, rep, cloudHD } from "./paint";
import { oceanTex, karstTex, caveWallTex, roosterArtTex, horseRiderArtTex, handStencilTex, crossSectionTex } from "./paint2";
import { LIGHTS, LOOK } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, ShotDef, smooth, V3, TOTAL } from "./story";

const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
});

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private torchLight: THREE.PointLight;
  private sky: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 20, 300);

  // Scene sub-groups
  private outdoor = new THREE.Group();
  private cave = new THREE.Group();
  private flashback = new THREE.Group();
  private science = new THREE.Group();

  // Cave wall paintings
  private roosterMesh!: THREE.Mesh;
  private riderMesh!: THREE.Mesh;
  private stencilMesh!: THREE.Mesh;
  private stencilGlowMesh!: THREE.Mesh;
  private flashMesh!: THREE.Mesh;

  constructor(kit: Kit) {
    const R = this.root;

    // Sky dome
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        c0: { value: new THREE.Color("#4a90e2") },
        c1: { value: new THREE.Color("#70b2ea") },
        c2: { value: new THREE.Color("#a6d3f8") },
        c3: { value: new THREE.Color("#cbe5fc") },
        c4: { value: new THREE.Color("#e8f4fd") },
        e: { value: new THREE.Vector4(0.1, 0.3, 0.6, 0.9) }
      },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);

    // Lights
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#3a3028", 1.2);
    this.sun = new THREE.DirectionalLight("#fff4e0", 2.2);
    this.sun.position.set(20, 40, -30);
    this.sun.castShadow = true;
    this.torchLight = new THREE.PointLight("#ffaa55", 3.0, 18, 1.5);
    this.torchLight.position.set(0.5, 2.5, -2.5);
    R.add(this.hemi, this.sun, this.sun.target, this.torchLight);

    // Build the 4 distinct scenic groups
    this.buildOutdoor();
    this.buildCave();
    this.buildFlashback();
    this.buildScience();

    R.add(this.outdoor, this.cave, this.flashback, this.science);
  }

  // 1. OUTDOOR (Shot 1): Karst cliff rising from turquoise ocean with cave mouth
  private buildOutdoor() {
    const G = this.outdoor;
    const waterMat = lam("waterMuna", () => ({ map: rep(oceanTex(), 16, 16), color: "#2596be" }));
    const karstMat = lam("karstMuna", () => ({ map: rep(karstTex(), 4, 8), color: "#8a8a82" }));
    const darkCaveMat = lam("darkCaveMuna", () => ({ color: "#141210" }));

    // Ocean plane
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), waterMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, 0, 0);
    ocean.receiveShadow = true;
    G.add(ocean);

    // Towering Karst cliff face
    const cliff = new THREE.Mesh(boxGeo(V(-40, 0, 8), V(40, 35, 30)), karstMat);
    cliff.castShadow = true; cliff.receiveShadow = true;
    G.add(cliff);

    // Side karst islands
    const islandL = new THREE.Mesh(boxGeo(V(-55, 0, -20), V(-25, 24, 5)), karstMat);
    const islandR = new THREE.Mesh(boxGeo(V(25, 0, -25), V(60, 28, 6)), karstMat);
    G.add(islandL, islandR);

    // Dark cave mouth in the cliff face
    const caveMouth = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.0, 7.0, 16), darkCaveMat);
    caveMouth.rotation.x = Math.PI / 2;
    caveMouth.position.set(0, 7.5, 8.1);
    G.add(caveMouth);
  }

  // 2. CAVE INTERIOR (Shots 2, 3, 4, 8, 9): Liang Metanduno cave chamber with paintings
  private buildCave() {
    const G = this.cave;
    const wallMat = lam("caveWallMat", () => ({ map: rep(caveWallTex(), 3, 2), color: "#d8cbb8" }));
    const floorMat = lam("caveFloorMat", () => ({ map: rep(caveWallTex(), 4, 4), color: "#b09f88" }));

    // Back wall
    const wall = new THREE.Mesh(boxGeo(V(-8, 0, 0.05), V(8, 6, 2.5)), wallMat);
    wall.receiveShadow = true;
    G.add(wall);

    // Cave floor
    const floor = new THREE.Mesh(boxGeo(V(-10, -0.4, -12), V(10, 0, 2)), floorMat);
    floor.receiveShadow = true;
    G.add(floor);

    // Cave ceiling / rock overhang
    const ceiling = new THREE.Mesh(boxGeo(V(-9, 5.2, -10), V(9, 7.5, 2)), wallMat);
    G.add(ceiling);

    // Stalactites & side rocks
    const colL = new THREE.Mesh(new THREE.ConeGeometry(0.8, 5, 8), wallMat);
    colL.position.set(-4.5, 2.5, -2);
    const colR = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5, 8), wallMat);
    colR.position.set(4.8, 2.5, -1.8);
    G.add(colL, colR);

    // --- CAVE PAINTINGS ---
    // 1. Rooster (ayam) painting plane
    const roosterMat = new THREE.MeshLambertMaterial({ map: roosterArtTex(), transparent: true, alphaTest: 0.05 });
    this.roosterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), roosterMat);
    this.roosterMesh.position.set(1.2, 2.1, 0.04);
    G.add(this.roosterMesh);

    // 2. Horse rider (orang naik kuda) painting plane
    const riderMat = new THREE.MeshLambertMaterial({ map: horseRiderArtTex(), transparent: true, alphaTest: 0.05 });
    this.riderMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), riderMat);
    this.riderMesh.position.set(-1.6, 2.15, 0.04);
    G.add(this.riderMesh);

    // 3. Hand stencil (stensil tangan kuno) between rooster and horse rider
    const stencilMat = new THREE.MeshLambertMaterial({ map: handStencilTex(false), transparent: true, alphaTest: 0.05 });
    this.stencilMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), stencilMat);
    this.stencilMesh.position.set(-0.15, 1.95, 0.035);
    G.add(this.stencilMesh);

    // 4. Glowing hand stencil overlay (illuminates at "tangan" / Shot 4 & 8)
    const glowMat = new THREE.MeshBasicMaterial({ map: handStencilTex(false, true), transparent: true, opacity: 0 });
    this.stencilGlowMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.35), glowMat);
    this.stencilGlowMesh.position.set(-0.15, 1.95, 0.03);
    G.add(this.stencilGlowMesh);

    // Camera flash mesh for Shot 9
    this.flashMesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0 }));
    this.flashMesh.position.set(0, 2, -1);
    G.add(this.flashMesh);
  }

  // 3. FLASHBACK (Shot 5): Warm firelight cave with hand pressing and pigment spraying
  private buildFlashback() {
    const G = this.flashback;
    const fbWallMat = lam("fbWallMat", () => ({ map: rep(caveWallTex(), 2, 2), color: "#c49068" }));
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), fbWallMat);
    wall.position.set(0, 2, 0);
    G.add(wall);

    // Stencil on wall during flashback
    const fbStencil = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshLambertMaterial({ map: handStencilTex(false), transparent: true }));
    fbStencil.position.set(0, 2.0, 0.02);
    G.add(fbStencil);
  }

  // 4. SCIENCE (Shots 6, 7): Cross-section diagram and dating visualization
  private buildScience() {
    const G = this.science;
    // Diagram plane
    const diagMat = new THREE.MeshBasicMaterial({ map: crossSectionTex() });
    const diag = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), diagMat);
    diag.position.set(0, 2.0, 0);
    G.add(diag);
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): THREE.Vector3 {
    // 1. Position camera
    const c = camAt(id, f);
    cam.position.set(...c.pos);
    cam.fov = c.fov;
    cam.rotation.z = c.roll;
    cam.updateProjectionMatrix();

    // 2. Control scenery visibility per shot
    this.outdoor.visible = (id === 1);
    this.cave.visible = (id === 2 || id === 3 || id === 4 || id === 8 || id === 9);
    this.flashback.visible = (id === 5);
    this.science.visible = (id === 6 || id === 7);

    // 3. Lighting adjustment
    if (id === 1) {
      this.hemi.color.set("#cfe6ff");
      this.hemi.intensity = 1.3;
      this.sun.intensity = 2.4;
      this.torchLight.intensity = 0;
    } else if (id === 5) {
      // Warm firelight flicker
      this.hemi.color.set("#ff7a30");
      this.hemi.intensity = 0.8;
      this.sun.intensity = 0;
      this.torchLight.color.set("#ff6611");
      this.torchLight.intensity = 3.5 + 0.6 * Math.sin(f * 0.4) + 0.3 * Math.cos(f * 0.9);
      this.torchLight.position.set(0, 1.5, -2.0);
    } else if (id === 6 || id === 7) {
      // Neutral scientific illumination
      this.hemi.color.set("#ffffff");
      this.hemi.intensity = 1.8;
      this.sun.intensity = 1.0;
      this.torchLight.intensity = 0;
    } else {
      // Cave torch / flashlight illumination
      this.hemi.color.set("#9e8e78");
      this.hemi.intensity = 0.6;
      this.sun.intensity = 0.2;
      this.torchLight.color.set("#fff0d0");
      this.torchLight.intensity = 2.8;
      this.torchLight.position.set(1.0, 2.2, -2.5);
    }

    // 4. Stencil glow animation (Shot 4 "tangan" at f=385, and Shot 8)
    if (this.stencilGlowMesh) {
      const glowMat = this.stencilGlowMesh.material as THREE.MeshBasicMaterial;
      if (id === 4 && f >= 370) {
        glowMat.opacity = Math.min(1.0, (f - 370) / 18);
      } else if (id === 8) {
        glowMat.opacity = 0.85 + 0.15 * Math.sin(f * 0.1);
      } else {
        glowMat.opacity = 0;
      }
    }

    // 5. Flashbulb effect (Shot 9 at f=1000)
    if (this.flashMesh) {
      const flashMat = this.flashMesh.material as THREE.MeshBasicMaterial;
      if (f >= 1000 && f < 1006) {
        flashMat.opacity = [1.0, 0.8, 0.5, 0.25, 0.1, 0.0][f - 1000];
      } else {
        flashMat.opacity = 0;
      }
    }

    cam.lookAt(...c.look);
    return new THREE.Vector3(...c.look);
  }
}

export const loadKit = async (): Promise<Kit> => ({});
