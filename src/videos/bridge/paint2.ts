import { ctex } from "./paint";

const TAU = Math.PI * 2;

/** Tropical turquoise ocean water for Shot 1 */
export const oceanTex = () => ctex("munaOceanHD", 1024, 1024, (g) => {
  const S = 1024;
  const gr = g.createLinearGradient(0, 0, 0, S);
  gr.addColorStop(0, "#1982a5");
  gr.addColorStop(0.5, "#209ebb");
  gr.addColorStop(1, "#156b88");
  g.fillStyle = gr;
  g.fillRect(0, 0, S, S);

  // Soft wave caustics
  g.strokeStyle = "rgba(255, 255, 255, 0.22)";
  g.lineWidth = 4;
  for (let y = 30; y < S; y += 48) {
    g.beginPath();
    for (let x = 0; x <= S; x += 32) {
      const dy = Math.sin(x * 0.02 + y * 0.03) * 12 + Math.cos(x * 0.05) * 6;
      if (x === 0) g.moveTo(x, y + dy);
      else g.lineTo(x, y + dy);
    }
    g.stroke();
  }
});

/** Karst limestone cliff with tropical green foliage ledges */
export const karstTex = () => ctex("munaKarstHD", 1024, 1024, (g) => {
  const S = 1024;
  g.fillStyle = "#8a8882";
  g.fillRect(0, 0, S, S);

  // Vertical fluting and erosion streaks
  for (let x = 0; x < S; x += 16) {
    const w = 8 + (x % 24);
    g.fillStyle = (x % 32 === 0) ? "rgba(65, 62, 58, 0.45)" : "rgba(115, 112, 105, 0.35)";
    g.fillRect(x, 0, w, S);
  }

  // Dense tropical greenery clumps on rock ledges
  g.fillStyle = "#3e6d2a";
  for (let i = 0; i < 40; i++) {
    const rx = (i * 73) % S;
    const ry = (i * 127) % S;
    g.beginPath();
    g.arc(rx, ry, 28 + (i % 20), 0, TAU);
    g.fill();
    g.fillStyle = "#2d521e";
    g.beginPath();
    g.arc(rx + 10, ry + 10, 18, 0, TAU);
    g.fill();
  }
});

/** Cave interior limestone rock wall */
export const caveWallTex = () => ctex("munaCaveWallHD", 1024, 1024, (g) => {
  const S = 1024;
  // Warm limestone base
  g.fillStyle = "#c8b89e";
  g.fillRect(0, 0, S, S);

  // Mineral staining & karst cracks
  for (let i = 0; i < 60; i++) {
    const x = (i * 89) % S;
    const y = (i * 131) % S;
    const rad = 40 + (i % 60);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, "rgba(140, 115, 90, 0.35)");
    gr.addColorStop(1, "rgba(200, 184, 158, 0)");
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
});

/** The famous Muna cave painting: rooster (ayam) in red ochre */
export const roosterArtTex = () => ctex("munaRoosterArt", 512, 512, (g) => {
  g.clearRect(0, 0, 512, 512);
  g.strokeStyle = "#a82e22";
  g.fillStyle = "#a82e22";
  g.lineWidth = 14;
  g.lineCap = "round";
  g.lineJoin = "round";

  // Body
  g.beginPath();
  g.ellipse(240, 260, 90, 55, 0.2, 0, TAU);
  g.fill();

  // Head and neck
  g.beginPath();
  g.moveTo(310, 240);
  g.quadraticCurveTo(340, 200, 350, 160);
  g.stroke();

  // Comb on head
  g.beginPath();
  g.arc(352, 145, 18, 0, TAU);
  g.fill();
  g.beginPath();
  g.arc(368, 150, 14, 0, TAU);
  g.fill();

  // Beak
  g.beginPath();
  g.moveTo(365, 160);
  g.lineTo(395, 168);
  g.lineTo(365, 176);
  g.fill();

  // Sweeping tail feathers
  g.lineWidth = 12;
  for (let k = 0; k < 4; k++) {
    g.beginPath();
    g.moveTo(160, 250);
    g.quadraticCurveTo(100 - k * 18, 180 - k * 22, 70 - k * 20, 120 + k * 25);
    g.stroke();
  }

  // Legs & spurs
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(220, 310);
  g.lineTo(210, 390);
  g.lineTo(190, 405);
  g.moveTo(260, 305);
  g.lineTo(265, 385);
  g.lineTo(285, 400);
  g.stroke();
});

/** Cave painting: horse rider (orang naik kuda) */
export const horseRiderArtTex = () => ctex("munaHorseRiderArt", 512, 512, (g) => {
  g.clearRect(0, 0, 512, 512);
  g.strokeStyle = "#a82e22";
  g.fillStyle = "#a82e22";
  g.lineWidth = 12;
  g.lineCap = "round";

  // Horse torso
  g.beginPath();
  g.ellipse(250, 280, 120, 45, 0.1, 0, TAU);
  g.fill();

  // Horse neck & head
  g.beginPath();
  g.moveTo(350, 260);
  g.lineTo(410, 200);
  g.lineTo(440, 210);
  g.stroke();

  // Horse legs
  g.beginPath();
  g.moveTo(170, 320); g.lineTo(160, 410);
  g.moveTo(200, 320); g.lineTo(210, 410);
  g.moveTo(320, 315); g.lineTo(315, 410);
  g.moveTo(350, 315); g.lineTo(365, 410);
  g.stroke();

  // Horse tail
  g.beginPath();
  g.moveTo(135, 280);
  g.quadraticCurveTo(100, 330, 95, 370);
  g.stroke();

  // Rider sitting on horse
  g.beginPath();
  g.arc(260, 165, 20, 0, TAU); // head
  g.fill();
  g.lineWidth = 14;
  g.beginPath();
  g.moveTo(260, 185);
  g.lineTo(260, 250); // torso
  g.lineTo(275, 290); // leg
  g.stroke();

  // Reins / spear
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(260, 205);
  g.lineTo(410, 200);
  g.stroke();
});

/** Ancient Sulawesi Hand Stencil with distinct tapered claw-like fingers */
export const handStencilTex = (faint = false, glow = false) => ctex(`munaHandStencil_${faint}_${glow}`, 512, 512, (g) => {
  g.clearRect(0, 0, 512, 512);

  // Negative spray background (red ochre spatter)
  const cx = 256, cy = 270;
  const alpha = faint ? 0.35 : (glow ? 0.95 : 0.75);
  const gr = g.createRadialGradient(cx, cy, 30, cx, cy, 210);
  gr.addColorStop(0, glow ? `rgba(255, 60, 30, ${alpha})` : `rgba(168, 46, 34, ${alpha})`);
  gr.addColorStop(0.65, glow ? `rgba(200, 40, 20, ${alpha * 0.7})` : `rgba(150, 38, 28, ${alpha * 0.6})`);
  gr.addColorStop(1, "rgba(168, 46, 34, 0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 512);

  // Punch out the hand silhouette (Negative stencil)
  g.globalCompositeOperation = "destination-out";

  // Palm
  g.beginPath();
  g.ellipse(cx, cy + 30, 55, 65, 0, 0, TAU);
  g.fill();

  // 5 Slender, elongated tapered claw-like fingers (distinctive Sulawesi rock art style)
  const drawFinger = (bx: number, by: number, tipX: number, tipY: number, w: number) => {
    g.beginPath();
    g.moveTo(bx - w / 2, by);
    g.quadraticCurveTo(bx + (tipX - bx) * 0.5, by + (tipY - by) * 0.5, tipX, tipY);
    g.quadraticCurveTo(bx + (tipX - bx) * 0.5 + w / 2, by + (tipY - by) * 0.5, bx + w / 2, by);
    g.fill();
  };

  drawFinger(cx - 45, cy + 15, cx - 110, cy - 25, 24); // Thumb
  drawFinger(cx - 28, cy - 25, cx - 65, cy - 145, 22);  // Index
  drawFinger(cx - 5, cy - 35, cx - 10, cy - 175, 23);   // Middle
  drawFinger(cx + 18, cy - 30, cx + 45, cy - 150, 22);  // Ring
  drawFinger(cx + 40, cy - 10, cx + 95, cy - 90, 20);   // Pinky

  // Arm/wrist
  g.beginPath();
  g.moveTo(cx - 38, cy + 85);
  g.lineTo(cx - 45, 512);
  g.lineTo(cx + 45, 512);
  g.lineTo(cx + 38, cy + 85);
  g.fill();

  g.globalCompositeOperation = "source-over";

  if (glow) {
    // Glowing neon outline
    g.strokeStyle = "#ffeaa7";
    g.lineWidth = 6;
    g.shadowColor = "#ff7675";
    g.shadowBlur = 24;
    // draw outline around hand
    g.stroke();
  }
});

/** Geological cross-section diagram showing 67.800 years dating */
export const crossSectionTex = () => ctex("munaCrossSectionDiagram", 1024, 1024, (g) => {
  const S = 1024;
  g.fillStyle = "#1e272e";
  g.fillRect(0, 0, S, S);

  // 1. Bedrock layer (Batu Kapur Liang Metanduno)
  g.fillStyle = "#718093";
  g.fillRect(80, 560, 864, 260);
  g.fillStyle = "#f5f6fa";
  g.font = "bold 32px sans-serif";
  g.fillText("BATUAN DASAR GUA (LIMESTONE)", 120, 700);

  // 2. Pigment layer (Oker Merah Stensil Tangan)
  g.fillStyle = "#e84118";
  g.fillRect(80, 510, 864, 50);
  g.fillStyle = "#ffffff";
  g.font = "bold 34px sans-serif";
  g.fillText("★ LAPISAN PIGMEN MERAH (STENSIL TANGAN)", 120, 545);

  // 3. Calcite mineral crust (Kerak Batu Kalsit yang diuji laser)
  g.fillStyle = "#dcdde1";
  g.fillRect(80, 330, 864, 180);
  g.fillStyle = "#2f3640";
  g.font = "bold 32px sans-serif";
  g.fillText("KERAK MINERAL KALSIT (TUMBUH DI ATAS PIGMEN)", 120, 420);

  // Laser beam graphic
  g.strokeStyle = "#00d2d3";
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(512, 80);
  g.lineTo(512, 330);
  g.stroke();

  // Laser sparkle
  g.fillStyle = "#54a0ff";
  g.beginPath();
  g.arc(512, 330, 20, 0, TAU);
  g.fill();

  // Big milestone box
  g.fillStyle = "#c23616";
  g.fillRect(160, 140, 704, 110);
  g.strokeStyle = "#fbc531";
  g.lineWidth = 6;
  g.strokeRect(160, 140, 704, 110);
  g.fillStyle = "#f5f6fa";
  g.font = "bold 56px sans-serif";
  g.textAlign = "center";
  g.fillText("MINIMAL 67.800 TAHUN LALU", 512, 215);

  // Subtitle
  g.fillStyle = "#fbc531";
  g.font = "bold 30px sans-serif";
  g.fillText("REKOR LUKISAN GUA TERTUA DI DUNIA", 512, 880);
});
