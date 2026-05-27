const fieldCanvas = document.querySelector("#water");
const effectsCanvas = document.querySelector("#effects");
const ctx = fieldCanvas.getContext("2d", { alpha: false });
const fx = effectsCanvas.getContext("2d");
const buffer = document.createElement("canvas");
const bufferCtx = buffer.getContext("2d", { alpha: false });

const sim = {
  cols: 0,
  rows: 0,
  scale: 4,
  current: new Float32Array(0),
  previous: new Float32Array(0),
  image: null,
  idlePulse: 0,
};

const pointers = new Map();
const stars = [];
const sparks = [];
const rings = [];
const wells = [];
const comets = [];
const ribbons = [];
const lenses = [];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(window.innerWidth * dpr);
  const height = Math.floor(window.innerHeight * dpr);

  for (const canvas of [fieldCanvas, effectsCanvas]) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }

  sim.scale = window.innerWidth < 760 ? 4 : 5;
  sim.cols = Math.ceil(width / sim.scale);
  sim.rows = Math.ceil(height / sim.scale);
  sim.current = new Float32Array(sim.cols * sim.rows);
  sim.previous = new Float32Array(sim.cols * sim.rows);
  sim.image = bufferCtx.createImageData(sim.cols, sim.rows);
  buffer.width = sim.cols;
  buffer.height = sim.rows;

  seedStars(width, height);
}

function seedStars(width, height) {
  stars.length = 0;
  const count = Math.round(clamp((width * height) / 4800, 170, 560));

  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      radius: 0.6 + Math.random() * 2.4,
      glow: 0.35 + Math.random() * 0.65,
      hue: Math.random(),
      twinkle: Math.random() * Math.PI * 2,
      vx: 0,
      vy: 0,
    });

    stars[i].x = stars[i].baseX;
    stars[i].y = stars[i].baseY;
  }
}

function index(x, y) {
  return y * sim.cols + x;
}

function toPoint(clientX, clientY) {
  const rect = fieldCanvas.getBoundingClientRect();
  const dprX = fieldCanvas.width / rect.width;
  const dprY = fieldCanvas.height / rect.height;

  return {
    x: Math.floor(((clientX - rect.left) * dprX) / sim.scale),
    y: Math.floor(((clientY - rect.top) * dprY) / sim.scale),
    px: (clientX - rect.left) * dprX,
    py: (clientY - rect.top) * dprY,
  };
}

function disturb(clientX, clientY, strength = 520, size = 1) {
  const point = toPoint(clientX, clientY);
  const radius = Math.max(5, Math.floor(Math.min(sim.cols, sim.rows) * 0.026 * size));

  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      const px = point.x + x;
      const py = point.y + y;
      if (px <= 1 || py <= 1 || px >= sim.cols - 2 || py >= sim.rows - 2) continue;

      const distance = Math.hypot(x, y) / radius;
      if (distance < 1) {
        const falloff = (1 + Math.cos(distance * Math.PI)) * 0.5;
        sim.previous[index(px, py)] += falloff * strength;
      }
    }
  }
}

function burst(clientX, clientY, power = 1) {
  const point = toPoint(clientX, clientY);
  rings.push({
    x: point.px,
    y: point.py,
    radius: 8,
    alpha: 0.95,
    speed: 9 + power * 4,
  });

  const count = Math.round(18 + power * 18);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (1.2 + Math.random() * 6.6) * power;
    sparks.push({
      x: point.px,
      y: point.py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 0.8 + Math.random() * 2.5,
      life: 38 + Math.random() * 34,
      maxLife: 72,
      hue: Math.random(),
    });
  }

  if (sparks.length > 900) sparks.splice(0, sparks.length - 900);

  for (const star of stars) {
    const dx = star.x - point.px;
    const dy = star.y - point.py;
    const distance = Math.max(1, Math.hypot(dx, dy));
    if (distance < 230 * power) {
      const force = (1 - distance / (230 * power)) * 5.8 * power;
      star.vx += (dx / distance) * force;
      star.vy += (dy / distance) * force;
    }
  }
}

function addRibbon(fromX, fromY, toX, toY, power = 1) {
  const start = toPoint(fromX, fromY);
  const end = toPoint(toX, toY);
  ribbons.push({
    x1: start.px,
    y1: start.py,
    x2: end.px,
    y2: end.py,
    drift: Math.random() * Math.PI * 2,
    width: 8 + power * 18,
    life: 42 + power * 24,
    maxLife: 66,
    hue: Math.random(),
  });

  if (ribbons.length > 70) ribbons.splice(0, ribbons.length - 70);
}

function addLens(clientX, clientY, power = 1) {
  const point = toPoint(clientX, clientY);
  lenses.push({
    x: point.px,
    y: point.py,
    radius: 24,
    alpha: 1,
    speed: 16 + power * 6,
    wobble: Math.random() * Math.PI * 2,
  });
}

function createWell(pointerId, clientX, clientY) {
  const point = toPoint(clientX, clientY);
  wells.push({
    pointerId,
    x: point.px,
    y: point.py,
    age: 0,
    power: 0.2,
    released: false,
  });
}

function updateWell(pointerId, clientX, clientY) {
  const well = wells.find((item) => item.pointerId === pointerId && !item.released);
  if (!well) return;

  const point = toPoint(clientX, clientY);
  well.x += (point.px - well.x) * 0.42;
  well.y += (point.py - well.y) * 0.42;
}

function releaseWell(pointerId, clientX, clientY) {
  const well = wells.find((item) => item.pointerId === pointerId && !item.released);
  if (!well) return;

  updateWell(pointerId, clientX, clientY);
  well.released = true;
  well.power = Math.max(well.power, 1.2);
  addLens(clientX, clientY, 1.6 + Math.min(well.age / 130, 1.5));
  burst(clientX, clientY, 1.7 + Math.min(well.age / 110, 1.4));
}

function spawnComet() {
  const fromLeft = Math.random() > 0.5;
  const y = effectsCanvas.height * (0.12 + Math.random() * 0.62);
  const speed = 7 + Math.random() * 6;

  comets.push({
    x: fromLeft ? -120 : effectsCanvas.width + 120,
    y,
    vx: (fromLeft ? 1 : -1) * speed,
    vy: 1.2 + Math.random() * 2.2,
    life: 90 + Math.random() * 50,
    maxLife: 140,
    radius: 2 + Math.random() * 2.5,
    hue: Math.random(),
  });
}

function paintGravity(time) {
  const data = sim.image.data;
  const damping = 0.973;

  for (let y = 1; y < sim.rows - 1; y += 1) {
    for (let x = 1; x < sim.cols - 1; x += 1) {
      const i = index(x, y);
      const wave =
        (sim.previous[i - 1] +
          sim.previous[i + 1] +
          sim.previous[i - sim.cols] +
          sim.previous[i + sim.cols]) *
          0.5 -
        sim.current[i];

      const value = wave * damping;
      sim.current[i] = value;

      const nebula =
        Math.sin(x * 0.028 + time * 0.00033) * 28 +
        Math.cos(y * 0.033 - time * 0.00025) * 22 +
        Math.sin((x + y) * 0.021 + time * 0.00018) * 20;
      const pulse = clamp(70 + nebula + value * 0.12, 0, 255);
      const pixel = i * 4;

      data[pixel] = clamp(4 + pulse * 0.16 + value * 0.018, 0, 255);
      data[pixel + 1] = clamp(3 + pulse * 0.12, 0, 255);
      data[pixel + 2] = clamp(16 + pulse * 0.43 + Math.abs(value) * 0.028, 0, 255);
      data[pixel + 3] = 255;
    }
  }

  [sim.current, sim.previous] = [sim.previous, sim.current];

  bufferCtx.putImageData(sim.image, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(buffer, 0, 0, fieldCanvas.width, fieldCanvas.height);
}

function starColor(star, alpha) {
  if (star.hue < 0.18) return `rgba(255, 221, 137, ${alpha})`;
  if (star.hue < 0.45) return `rgba(255, 146, 176, ${alpha})`;
  if (star.hue < 0.72) return `rgba(170, 186, 255, ${alpha})`;
  return `rgba(230, 255, 255, ${alpha})`;
}

function paintConstellations(time) {
  fx.save();
  fx.globalCompositeOperation = "screen";
  fx.lineWidth = Math.max(1, effectsCanvas.width * 0.0007);

  for (let i = 0; i < stars.length; i += 11) {
    const a = stars[i];
    const b = stars[(i + 7) % stars.length];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (distance > 80 && distance < 210) {
      const alpha = 0.035 + Math.sin(time * 0.001 + i) * 0.018;
      fx.strokeStyle = `rgba(180, 207, 255, ${alpha})`;
      fx.beginPath();
      fx.moveTo(a.x, a.y);
      fx.lineTo(b.x, b.y);
      fx.stroke();
    }
  }

  fx.restore();
}

function pullStarsIntoWells() {
  for (const well of wells) {
    well.age += 1;
    well.power = well.released ? well.power * 0.94 : clamp(well.power + 0.018, 0.2, 1.65);

    const reach = 170 + well.power * 145;
    const spin = well.released ? -0.018 : 0.032;

    for (const star of stars) {
      const dx = well.x - star.x;
      const dy = well.y - star.y;
      const distance = Math.max(18, Math.hypot(dx, dy));
      if (distance > reach) continue;

      const pull = (1 - distance / reach) * well.power;
      const nx = dx / distance;
      const ny = dy / distance;
      const direction = well.released ? -1 : 1;

      star.vx += nx * pull * 0.34 * direction + -ny * pull * spin;
      star.vy += ny * pull * 0.34 * direction + nx * pull * spin;
      star.twinkle += pull * 0.35;
    }
  }

  for (let i = wells.length - 1; i >= 0; i -= 1) {
    if (wells[i].released && wells[i].power < 0.035) wells.splice(i, 1);
  }
}

function paintWells(time) {
  for (const well of wells) {
    const core = 18 + well.power * 24;
    const halo = 92 + well.power * 110;
    const pulse = Math.sin(time * 0.006 + well.age * 0.05) * 0.08 + 0.92;

    fx.save();
    fx.translate(well.x, well.y);
    fx.rotate(time * 0.0018 + well.age * 0.018);

    const glow = fx.createRadialGradient(0, 0, 0, 0, 0, halo * pulse);
    glow.addColorStop(0, `rgba(255, 245, 199, ${0.32 * well.power})`);
    glow.addColorStop(0.22, `rgba(255, 115, 148, ${0.18 * well.power})`);
    glow.addColorStop(0.58, `rgba(109, 93, 242, ${0.12 * well.power})`);
    glow.addColorStop(1, "rgba(109, 93, 242, 0)");
    fx.fillStyle = glow;
    fx.beginPath();
    fx.arc(0, 0, halo * pulse, 0, Math.PI * 2);
    fx.fill();

    fx.lineWidth = Math.max(1, effectsCanvas.width * 0.001);
    for (let arm = 0; arm < 3; arm += 1) {
      fx.strokeStyle = `rgba(255, 145, 184, ${0.13 * well.power})`;
      fx.lineWidth = Math.max(1, effectsCanvas.width * 0.0013);
      fx.beginPath();

      for (let step = 0; step < 76; step += 1) {
        const t = step / 75;
        const angle = arm * ((Math.PI * 2) / 3) + t * Math.PI * 3.2;
        const radius = core * 0.9 + t * halo * 0.72;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.42;
        if (step === 0) fx.moveTo(x, y);
        else fx.lineTo(x, y);
      }

      fx.stroke();
    }

    for (let i = 0; i < 4; i += 1) {
      const orbitAlpha = clamp(0.18 * well.power - i * 0.025, 0, 1);
      fx.strokeStyle = `rgba(255, 232, 171, ${orbitAlpha})`;
      fx.beginPath();
      fx.ellipse(0, 0, core * (2.3 + i), core * (0.54 + i * 0.12), 0, 0, Math.PI * 2);
      fx.stroke();
      fx.rotate(Math.PI / 5);
    }

    fx.fillStyle = `rgba(3, 2, 9, ${0.9 * clamp(well.power, 0, 1)})`;
    fx.beginPath();
    fx.arc(0, 0, core * 0.72, 0, Math.PI * 2);
    fx.fill();

    fx.restore();
  }
}

function paintRibbons(time) {
  for (let i = ribbons.length - 1; i >= 0; i -= 1) {
    const ribbon = ribbons[i];
    ribbon.life -= 1;

    const alpha = clamp(ribbon.life / ribbon.maxLife, 0, 1);
    const bend = Math.sin(time * 0.003 + ribbon.drift) * 42;
    const mx = (ribbon.x1 + ribbon.x2) * 0.5;
    const my = (ribbon.y1 + ribbon.y2) * 0.5;
    const angle = Math.atan2(ribbon.y2 - ribbon.y1, ribbon.x2 - ribbon.x1) + Math.PI / 2;
    const cx = mx + Math.cos(angle) * bend;
    const cy = my + Math.sin(angle) * bend;

    const gradient = fx.createLinearGradient(ribbon.x1, ribbon.y1, ribbon.x2, ribbon.y2);
    gradient.addColorStop(0, "rgba(109, 93, 242, 0)");
    gradient.addColorStop(0.3, `rgba(255, 115, 148, ${alpha * 0.32})`);
    gradient.addColorStop(0.56, `rgba(255, 231, 162, ${alpha * 0.48})`);
    gradient.addColorStop(1, "rgba(170, 186, 255, 0)");

    fx.strokeStyle = gradient;
    fx.lineWidth = ribbon.width * alpha;
    fx.lineCap = "round";
    fx.beginPath();
    fx.moveTo(ribbon.x1, ribbon.y1);
    fx.quadraticCurveTo(cx, cy, ribbon.x2, ribbon.y2);
    fx.stroke();

    fx.lineWidth = Math.max(1, ribbon.width * 0.18 * alpha);
    fx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.42})`;
    fx.stroke();

    if (ribbon.life <= 0) ribbons.splice(i, 1);
  }
}

function paintLenses(time) {
  for (let i = lenses.length - 1; i >= 0; i -= 1) {
    const lens = lenses[i];
    lens.radius += lens.speed;
    lens.speed *= 0.985;
    lens.alpha *= 0.925;

    const wobble = Math.sin(time * 0.006 + lens.wobble) * 0.08 + 1;
    const gradient = fx.createRadialGradient(
      lens.x,
      lens.y,
      lens.radius * 0.18,
      lens.x,
      lens.y,
      lens.radius * wobble
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.46, `rgba(255, 244, 202, ${lens.alpha * 0.14})`);
    gradient.addColorStop(0.52, `rgba(255, 255, 255, ${lens.alpha * 0.66})`);
    gradient.addColorStop(0.58, `rgba(140, 166, 255, ${lens.alpha * 0.24})`);
    gradient.addColorStop(1, "rgba(109, 93, 242, 0)");

    fx.fillStyle = gradient;
    fx.beginPath();
    fx.arc(lens.x, lens.y, lens.radius * wobble, 0, Math.PI * 2);
    fx.fill();

    fx.strokeStyle = `rgba(255, 246, 205, ${lens.alpha * 0.55})`;
    fx.lineWidth = Math.max(1, effectsCanvas.width * 0.0014);
    fx.beginPath();
    fx.ellipse(lens.x, lens.y, lens.radius, lens.radius * 0.72, time * 0.001 + lens.wobble, 0, Math.PI * 2);
    fx.stroke();

    if (lens.alpha < 0.018) lenses.splice(i, 1);
  }
}

function paintEffects(time) {
  fx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);
  paintConstellations(time);
  pullStarsIntoWells();

  fx.save();
  fx.globalCompositeOperation = "lighter";
  paintRibbons(time);
  paintLenses(time);
  paintWells(time);

  for (const star of stars) {
    star.twinkle += 0.018 + star.radius * 0.004;
    star.vx += (star.baseX - star.x) * 0.0009;
    star.vy += (star.baseY - star.y) * 0.0009;
    star.vx *= 0.965;
    star.vy *= 0.965;
    star.x += star.vx + Math.sin(time * 0.00022 + star.baseY) * 0.08;
    star.y += star.vy + Math.cos(time * 0.00018 + star.baseX) * 0.08;

    const alpha = clamp(star.glow + Math.sin(star.twinkle) * 0.25, 0.12, 1);
    fx.fillStyle = starColor(star, alpha);
    fx.beginPath();
    fx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    fx.fill();

    if (star.radius > 1.9) {
      const glow = fx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 9);
      glow.addColorStop(0, starColor(star, alpha * 0.36));
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      fx.fillStyle = glow;
      fx.beginPath();
      fx.arc(star.x, star.y, star.radius * 9, 0, Math.PI * 2);
      fx.fill();
    }
  }

  for (let i = rings.length - 1; i >= 0; i -= 1) {
    const ring = rings[i];
    ring.radius += ring.speed;
    ring.alpha *= 0.925;

    fx.lineWidth = Math.max(1, effectsCanvas.width * 0.0012);
    fx.strokeStyle = `rgba(255, 230, 172, ${ring.alpha})`;
    fx.beginPath();
    fx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    fx.stroke();

    fx.strokeStyle = `rgba(150, 178, 255, ${ring.alpha * 0.55})`;
    fx.beginPath();
    fx.arc(ring.x, ring.y, ring.radius * 0.62, 0, Math.PI * 2);
    fx.stroke();

    if (ring.alpha < 0.02) rings.splice(i, 1);
  }

  for (let i = sparks.length - 1; i >= 0; i -= 1) {
    const spark = sparks[i];
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.vx *= 0.982;
    spark.vy *= 0.982;
    spark.life -= 1;

    const alpha = Math.max(0, spark.life / spark.maxLife);
    fx.strokeStyle = starColor(spark, alpha * 0.95);
    fx.lineWidth = Math.max(1, spark.radius);
    fx.beginPath();
    fx.moveTo(spark.x, spark.y);
    fx.lineTo(spark.x - spark.vx * 2.8, spark.y - spark.vy * 2.8);
    fx.stroke();

    fx.fillStyle = starColor(spark, alpha);
    fx.beginPath();
    fx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
    fx.fill();

    if (spark.life <= 0) sparks.splice(i, 1);
  }

  for (let i = comets.length - 1; i >= 0; i -= 1) {
    const comet = comets[i];
    comet.x += comet.vx;
    comet.y += comet.vy;
    comet.life -= 1;

    const alpha = clamp(comet.life / comet.maxLife, 0, 1);
    const tail = 140 + comet.radius * 18;
    const gradient = fx.createLinearGradient(
      comet.x,
      comet.y,
      comet.x - comet.vx * tail * 0.12,
      comet.y - comet.vy * tail * 0.12
    );
    gradient.addColorStop(0, `rgba(255, 246, 205, ${alpha})`);
    gradient.addColorStop(0.35, `rgba(255, 122, 161, ${alpha * 0.46})`);
    gradient.addColorStop(1, "rgba(109, 93, 242, 0)");

    fx.strokeStyle = gradient;
    fx.lineWidth = comet.radius * 2.2;
    fx.beginPath();
    fx.moveTo(comet.x, comet.y);
    fx.lineTo(comet.x - comet.vx * tail * 0.12, comet.y - comet.vy * tail * 0.12);
    fx.stroke();

    fx.fillStyle = `rgba(255, 250, 226, ${alpha})`;
    fx.beginPath();
    fx.arc(comet.x, comet.y, comet.radius, 0, Math.PI * 2);
    fx.fill();

    if (
      comet.life <= 0 ||
      comet.x < -220 ||
      comet.x > effectsCanvas.width + 220 ||
      comet.y > effectsCanvas.height + 220
    ) {
      comets.splice(i, 1);
    }
  }

  fx.restore();
}

function animate(time) {
  paintGravity(time);
  paintEffects(time);

  sim.idlePulse += 1;
  if (sim.idlePulse % 118 === 0 && pointers.size === 0) {
    const x = window.innerWidth * (0.2 + Math.random() * 0.6);
    const y = window.innerHeight * (0.16 + Math.random() * 0.56);
    disturb(x, y, 180, 0.85);
    if (Math.random() > 0.4) burst(x, y, 0.35);
  }

  if (sim.idlePulse % 220 === 0 && comets.length < 3) {
    spawnComet();
  }

  requestAnimationFrame(animate);
}

function onPointerDown(event) {
  fieldCanvas.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  createWell(event.pointerId, event.clientX, event.clientY);
  disturb(event.clientX, event.clientY, 1050, 1.3);
  burst(event.clientX, event.clientY, 1.15);
}

function onPointerMove(event) {
  if (!pointers.has(event.pointerId)) return;

  const last = pointers.get(event.pointerId);
  const distance = Math.hypot(event.clientX - last.x, event.clientY - last.y);
  const steps = Math.max(1, Math.ceil(distance / 16));

  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const x = last.x + (event.clientX - last.x) * t;
    const y = last.y + (event.clientY - last.y) * t;
    disturb(x, y, 420, 0.82);
  }

  if (distance > 8) {
    const power = clamp(distance / 42, 0.35, 1.35);
    addRibbon(last.x, last.y, event.clientX, event.clientY, power);
    burst(event.clientX, event.clientY, power);
  }
  updateWell(event.pointerId, event.clientX, event.clientY);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
}

function onPointerUp(event) {
  if (pointers.has(event.pointerId)) {
    disturb(event.clientX, event.clientY, -360, 0.9);
    releaseWell(event.pointerId, event.clientX, event.clientY);
  }

  pointers.delete(event.pointerId);
}

resize();
window.addEventListener("resize", resize);
fieldCanvas.addEventListener("pointerdown", onPointerDown);
fieldCanvas.addEventListener("pointermove", onPointerMove);
fieldCanvas.addEventListener("pointerup", onPointerUp);
fieldCanvas.addEventListener("pointercancel", onPointerUp);

requestAnimationFrame(animate);
