const fieldCanvas = document.querySelector("#water");
const effectsCanvas = document.querySelector("#effects");
const ctx = fieldCanvas.getContext("2d", { alpha: false });
const fx = effectsCanvas.getContext("2d");
const buffer = document.createElement("canvas");
const bufferCtx = buffer.getContext("2d", { alpha: false });
const reading = document.querySelector("#reading");
const loveForm = document.querySelector("#love-form");
const nameAInput = document.querySelector("#name-a");
const nameBInput = document.querySelector("#name-b");
const readingLabel = document.querySelector("#reading-label");
const fortuneTitle = document.querySelector("#fortune-title");
const fortuneMessage = document.querySelector("#fortune-message");
const lineTip = document.querySelector("#line-tip");
const lineMessage = document.querySelector("#line-message");
const fortuneSpell = document.querySelector("#fortune-spell");
const fortuneScore = document.querySelector("#fortune-score");
const fortuneAction = document.querySelector("#fortune-action");
const fortuneConstellation = document.querySelector("#fortune-constellation");
const againButton = document.querySelector("#again-button");

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
const lightnings = [];
const soulStars = [];
let stormFlash = 0;
let latestFortuneAt = 0;
let readingCount = 0;

const fortunes = [
  {
    title: "流れ星の追い風",
    message: "動き出すほど運が整います。迷っていることは、小さく試すだけで道が見えます。",
    action: "最初の一歩",
  },
  {
    title: "静かな雷鳴",
    message: "言葉にする前の直感が強い日です。すぐ答えを出さず、胸の奥の違和感を拾ってください。",
    action: "深呼吸",
  },
  {
    title: "銀河の再配置",
    message: "予定を少し組み替えると運気が上がります。余白を作るほど、大事なものが入ってきます。",
    action: "予定整理",
  },
  {
    title: "金色の星座",
    message: "人との縁が光ります。短い連絡や一言の感謝が、思ったより大きく返ってきます。",
    action: "連絡する",
  },
  {
    title: "青白い閃光",
    message: "集中力が鋭くなっています。難しい作業は今日のうちに少しだけ進めると勝ちです。",
    action: "一点集中",
  },
  {
    title: "星雲の休息",
    message: "急がない方が強い日です。休むことも前進なので、体力を未来へ残してください。",
    action: "早めに休む",
  },
  {
    title: "双子星の合図",
    message: "一人で抱えていたことに助けが入ります。頼る相手を選べば、話は軽くなります。",
    action: "相談する",
  },
  {
    title: "遠雷の変化",
    message: "少し怖い変化ほど、今のあなたには必要な刺激です。無理なく近づいてみてください。",
    action: "選び直す",
  },
];

const labels = ["今日の兆し", "星の返事", "雷の助言", "今夜の導き"];
const constellations = [
  "雷魚座",
  "月雫座",
  "夜風座",
  "流砂座",
  "白火座",
  "星猫座",
  "遠灯座",
  "小嵐座",
  "双花座",
  "朝露座",
  "薄雲座",
  "秘密座",
  "淡雪座",
  "金糸座",
  "小惑星座",
  "夕凪座",
];
const spells = [
  "迷いは小さく砕いて、星屑として進め。",
  "焦げた願いほど、次の光を知っている。",
  "今日の偶然を、ひとつだけ信じてみて。",
  "まだ言葉にならない方角へ、半歩だけ。",
  "静かな方を選ぶと、雷は味方になる。",
  "見送ったものが、別の入口を連れてくる。",
  "強く願うより、軽く始める方が速い。",
  "夜の端っこに、返事はもう置いてある。",
];
const comboTitles = ["一回目の星読み", "二連星モード", "三雷覚醒", "星雷ループ"];
const loveTitles = [
  "引力強めの二連星",
  "近づくほど光る相性",
  "雷が走る予感",
  "ゆっくり育つ星雲",
  "似てないから惹かれる軌道",
  "偶然が味方する距離",
  "返信から始まる小さな銀河",
  "目が合うたび軌道が変わる",
  "じわっと温度が上がる関係",
  "不意打ちに弱い恋の配置",
  "安心と刺激のハーフムーン",
  "まだ名前のない二人の星座",
  "遠回りが効く恋の回路",
  "言葉より空気で近づく相性",
];
const loveMessages = [
  "会話のテンポが鍵です。短いやり取りでも、気持ちの温度が伝わりやすい組み合わせです。",
  "急ぎすぎると星が散ります。相手のペースを尊重すると、自然に距離が縮まります。",
  "違いが魅力になる相性です。分かり合おうとするより、面白がる方がうまくいきます。",
  "一緒に何かを作ると運気が上がります。小さな予定や共通の遊びが火種になります。",
  "沈黙も悪くない組み合わせです。無理に盛り上げず、安心できる空気を大切に。",
  "タイミングが合うほど強く光ります。誘うなら軽く、でも言葉はまっすぐが吉です。",
  "相手の反応を読みすぎない方がうまくいきます。素直な一文が、変な駆け引きより強い日です。",
  "ふたりの距離は急に縮めるより、何度か自然に接点を作る方が安定します。",
  "冗談や軽い話題から本音が出やすい相性です。重く始めないのが今日のコツです。",
  "相手は意外と細かい優しさを見ています。大きな言葉より、気づいている姿勢が効きます。",
  "今は押すより、思い出してもらう方が強い流れです。短く印象に残る連絡が合います。",
  "共通点より違いの方にヒントがあります。知らない一面を聞くと、空気が動きます。",
  "少し照れるくらいの言葉に運があります。まっすぐすぎる一言が、今日は悪くありません。",
  "一度止まっていた会話にも火が戻りやすい日です。再開のきっかけを軽く投げてみてください。",
  "相手の生活リズムに合わせると届きやすい相性です。タイミングを選ぶだけで印象が変わります。",
  "気持ちを全部言わなくても大丈夫です。余白のある言葉が、相手の想像を誘います。",
];
const loveSpells = [
  "近づきすぎず、でも目を逸らさない。",
  "好きの前に、楽しいをひとつ増やす。",
  "相手の星を変えず、自分の光で照らす。",
  "返信より、余韻を大事にする。",
  "言えない気持ちは、やさしい行動に変える。",
  "今日は小さな勇気が、恋の雷になる。",
  "押すより、届く角度を探す。",
  "軽い言葉に、本音を一滴だけ混ぜる。",
  "待つ時間も、恋の演出にする。",
  "相手の沈黙を悪者にしない。",
  "誘いは短く、気持ちはやわらかく。",
  "照れたまま送る言葉ほど、星に近い。",
  "完璧な文より、今の温度を送る。",
  "距離は詰めるより、灯りを置く。",
];
const relationTypes = [
  "追い風型",
  "じわ育ち型",
  "刺激型",
  "安心型",
  "再会型",
  "冒険型",
  "余韻型",
  "照れ隠し型",
  "会話復活型",
  "急接近注意型",
  "ほっとする型",
  "片思い加速型",
];
const lineTemplates = {
  high: [
    "{name}、今日ちょっと話したいな。少しだけ時間ある？",
    "{name}と話すと元気出るから、また近いうちに話したい。",
    "今日ふと思い出した。{name}は最近どうしてる？",
    "今度、軽くごはんかお茶行かない？{name}と話したい。",
    "{name}に聞いてほしい話ある。今度ちょっとだけ会える？",
    "なんか今日、{name}と話したい気分だった。",
    "{name}といる時の空気、けっこう好きなんだよね。",
    "今度の休み、少しだけ一緒に出かけない？",
    "急だけど、{name}の声聞きたくなった。",
    "最近ちゃんと言えてなかったけど、{name}と話す時間好き。",
    "今度会えたらうれしい。短い時間でもいいから。",
    "{name}と行きたい場所見つけた。送ってもいい？",
  ],
  middle: [
    "{name}、最近どう？無理してない？",
    "ちょっと聞きたいことあるんだけど、今度話せる？",
    "この前の話、少し気になってた。{name}の続き聞きたい。",
    "急にごめん。今日なんとなく{名前}に連絡したくなった。",
    "{name}が好きそうなの見つけたから送るね。",
    "この前言ってたやつ、どうなった？ちょっと気になってた。",
    "今日ちょっと疲れたから、{name}の話聞きたくなった。",
    "今度タイミング合ったら、少し話そう。",
    "これ見て{名前}思い出した。たぶん好きそう。",
    "最近ばたばたしてた？落ち着いたら話そ。",
    "短くていいから、近況聞かせて。",
    "{name}に相談したいことある。重くないやつ。",
  ],
  slow: [
    "{name}、元気？返事いつでも大丈夫。",
    "久しぶり。最近どうしてるかなと思って連絡してみた。",
    "無理に返さなくていいんだけど、ちょっと思い出した。",
    "{name}のペースで大丈夫。また話せたらうれしい。",
    "急にごめんね。元気にしてるかなと思って。",
    "返事急がなくていいよ。ちょっと近況聞きたかっただけ。",
    "久しぶりに話したくなった。時間ある時で大丈夫。",
    "元気ならそれでいいんだけど、少し気になって連絡した。",
    "最近寒い/暑いけど体調大丈夫？無理しないでね。",
    "ふと思い出したから連絡してみた。返せる時でいいよ。",
    "またいつかゆっくり話せたらうれしい。",
    "{name}の近況、聞けたらうれしい。急がないよ。",
  ],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function textSeed(value) {
  let hash = 2166136261;
  for (const char of value.trim()) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function daySeed() {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function pickLineMessage(name, score, wave) {
  const tier = score >= 82 ? "high" : score >= 68 ? "middle" : "slow";
  const options = lineTemplates[tier];
  return options[Math.floor(wave * 4.3) % options.length].replaceAll("{name}", name).replaceAll("{名前}", name);
}

function pickFortune(clientX, clientY, charge = 1) {
  const seed =
    clientX * 0.017 +
    clientY * 0.029 +
    charge * 0.071 +
    stars.length * 0.003 +
    Date.now() * 0.00013;
  const wave = Math.abs(Math.sin(seed) * 10000);
  const item = fortunes[Math.floor(wave) % fortunes.length];
  const score = Math.round(clamp(58 + (wave % 39) + charge * 4, 1, 99));
  const lucky = ["金", "白", "群青", "薄桃", "水色", "菫色"][Math.floor(wave * 1.7) % 6];
  const combo = comboTitles[Math.min(readingCount, comboTitles.length - 1)];

  return {
    ...item,
    label: `${labels[Math.floor(wave * 2.3) % labels.length]} / ${combo}`,
    score,
    lucky,
    spell: spells[Math.floor(wave * 3.1) % spells.length],
    constellation: constellations[Math.floor(wave * 2.9) % constellations.length],
  };
}

function revealFortune(clientX, clientY, charge = 1) {
  const now = performance.now();
  if (now - latestFortuneAt < 520) return;
  latestFortuneAt = now;
  readingCount += 1;

  const fortune = pickFortune(clientX, clientY, charge);
  readingLabel.textContent = fortune.label;
  fortuneTitle.textContent = fortune.title;
  fortuneMessage.textContent = fortune.message;
  lineTip.classList.remove("is-visible");
  lineMessage.textContent = "名前を入れると、送る一言が出ます。";
  fortuneSpell.textContent = fortune.spell;
  fortuneScore.textContent = `星雷度 ${fortune.score}`;
  fortuneAction.textContent = `${fortune.action} / ${fortune.lucky}`;
  fortuneConstellation.textContent = fortune.constellation;
  reading.classList.remove("is-revealed");

  if (readingCount % 3 === 0) {
    addSkyStrike(clientX, clientY, 1.35);
    spawnComet();
  }

  requestAnimationFrame(() => {
    reading.classList.add("is-revealed");
  });
}

function revealLoveFortune(clientX, clientY, charge = 1) {
  const nameA = nameAInput.value.trim();
  const nameB = nameBInput.value.trim();
  if (!nameA || !nameB) {
    revealFortune(clientX, clientY, charge);
    return;
  }

  const seed = textSeed(`${nameA}|${nameB}`) + daySeed() + Math.round(charge * 101);
  const wave = Math.abs(Math.sin(seed * 0.00091) * 10000);
  const score = Math.round(clamp(52 + (wave % 43) + charge * 3, 1, 99));
  const title = loveTitles[seed % loveTitles.length];
  const message = loveMessages[Math.floor(wave) % loveMessages.length];
  const spell = loveSpells[Math.floor(wave * 1.7) % loveSpells.length];
  const constellation = constellations[Math.floor(wave * 2.1) % constellations.length];
  const lucky = ["桃色", "白", "金", "水色", "菫色", "群青"][Math.floor(wave * 2.8) % 6];
  const relation = relationTypes[Math.floor(wave * 3.7) % relationTypes.length];
  const line = pickLineMessage(nameB, score, wave);

  readingCount += 1;
  latestFortuneAt = performance.now();
  readingLabel.textContent = `${nameA} × ${nameB} / ${relation}`;
  fortuneTitle.textContent = title;
  fortuneMessage.textContent = message;
  lineMessage.textContent = line;
  lineTip.classList.add("is-visible");
  fortuneSpell.textContent = spell;
  fortuneScore.textContent = `相性 ${score}%`;
  fortuneAction.textContent = `${score >= 82 ? "近め" : score >= 68 ? "半歩ずつ" : "ゆっくり"} / ${lucky}`;
  fortuneConstellation.textContent = constellation;
  reading.classList.remove("is-revealed");

  addSoulStars(nameA, nameB, score);
  addSkyStrike(clientX, clientY, 1.05 + score / 120);
  addLens(clientX, clientY, 1.2);
  burst(clientX, clientY, 1.35);
  requestAnimationFrame(() => {
    reading.classList.add("is-revealed");
  });
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

function addSoulStars(nameA, nameB, score) {
  soulStars.length = 0;
  const centerX = effectsCanvas.width * 0.5;
  const centerY = effectsCanvas.height * 0.45;
  const spread = effectsCanvas.width < 760 ? effectsCanvas.width * 0.28 : 210;
  const seedA = textSeed(nameA);
  const seedB = textSeed(nameB);

  soulStars.push(
    {
      x: centerX - spread,
      y: centerY + Math.sin(seedA) * 60,
      targetX: centerX - 34,
      targetY: centerY - 18,
      radius: 9 + (seedA % 8),
      life: 260,
      maxLife: 260,
      score,
    },
    {
      x: centerX + spread,
      y: centerY + Math.cos(seedB) * 60,
      targetX: centerX + 34,
      targetY: centerY + 18,
      radius: 9 + (seedB % 8),
      life: 260,
      maxLife: 260,
      score,
    }
  );
}

function makeBoltPoints(x1, y1, x2, y2, segments, jaggedness) {
  const points = [{ x: x1, y: y1 }];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const normal = Math.atan2(dy, dx) + Math.PI / 2;
  let previousOffset = 0;

  for (let i = 1; i < segments; i += 1) {
    const t = i / segments;
    const arc = Math.sin(t * Math.PI);
    const chaos = (Math.random() - 0.5) * jaggedness * arc;
    const offset = previousOffset * 0.52 + chaos;
    previousOffset = offset;
    points.push({
      x: x1 + dx * t + Math.cos(normal) * offset,
      y: y1 + dy * t + Math.sin(normal) * offset,
    });
  }

  points.push({ x: x2, y: y2 });
  return points;
}

function addLightning(fromX, fromY, toX, toY, power = 1) {
  const start = toPoint(fromX, fromY);
  const end = toPoint(toX, toY);
  const length = Math.hypot(end.px - start.px, end.py - start.py);
  const segments = Math.round(clamp(length / 34, 8, 26) + power * 5);
  const jaggedness = 18 + power * 38 + length * 0.045;
  const points = makeBoltPoints(start.px, start.py, end.px, end.py, segments, jaggedness);
  const branches = [];

  for (let i = 2; i < points.length - 2; i += 1) {
    if (Math.random() > 0.34) continue;
    const base = points[i];
    const mainAngle = Math.atan2(end.py - start.py, end.px - start.px);
    const angle = mainAngle + (Math.random() > 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.75);
    const branchLength = (22 + Math.random() * 86) * power * (1 - i / points.length + 0.45);
    branches.push(
      makeBoltPoints(
        base.x,
        base.y,
        base.x + Math.cos(angle) * branchLength,
        base.y + Math.sin(angle) * branchLength,
        4 + Math.round(Math.random() * 4),
        jaggedness * 0.22
      )
    );
  }

  lightnings.push({
    points,
    branches,
    life: 7 + Math.round(power * 5),
    maxLife: 12,
    width: 1.25 + power * 2.15,
    jitter: 0.8 + power * 1.8,
  });

  if (lightnings.length > 34) lightnings.splice(0, lightnings.length - 34);
  stormFlash = Math.min(0.34, stormFlash + 0.055 * power);
}

function addSkyStrike(clientX, clientY, power = 1) {
  const point = toPoint(clientX, clientY);
  const startX = clientX + (Math.random() - 0.5) * window.innerWidth * 0.52;
  addLightning(startX, -20, clientX, clientY, power);
  if (Math.random() > 0.32) {
    addLightning(clientX, clientY, clientX + (Math.random() - 0.5) * 150, clientY + 70 + Math.random() * 110, power * 0.42);
  }
  disturb(clientX, clientY, 700 * power, 1.1);
  addLens(clientX, clientY, power * 0.85);

  for (const star of stars) {
    const dx = star.x - point.px;
    const dy = star.y - point.py;
    const distance = Math.max(1, Math.hypot(dx, dy));
    if (distance < 280 * power) {
      const force = (1 - distance / (280 * power)) * 6.4 * power;
      star.vx += (dx / distance) * force;
      star.vy += (dy / distance) * force;
      star.twinkle += force * 0.6;
    }
  }
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
  const charge = 1 + Math.min(well.age / 120, 2);
  well.released = true;
  well.power = Math.max(well.power, 1.2);
  addLens(clientX, clientY, 1.6 + Math.min(well.age / 130, 1.5));
  addSkyStrike(clientX, clientY, 1.2 + Math.min(well.age / 130, 1.4));
  burst(clientX, clientY, 1.7 + Math.min(well.age / 110, 1.4));
  if (nameAInput.value.trim() && nameBInput.value.trim()) {
    revealLoveFortune(clientX, clientY, charge);
  } else {
    revealFortune(clientX, clientY, charge);
  }
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

function paintSoulStars(time) {
  if (soulStars.length < 2) return;

  const [a, b] = soulStars;
  const alpha = clamp(Math.min(a.life, b.life) / a.maxLife, 0, 1);
  const pulse = 0.78 + Math.sin(time * 0.006) * 0.22;
  const mx = (a.x + b.x) * 0.5;
  const my = (a.y + b.y) * 0.5;

  fx.save();
  fx.globalCompositeOperation = "lighter";

  for (const soul of soulStars) {
    soul.x += (soul.targetX - soul.x) * 0.038;
    soul.y += (soul.targetY - soul.y) * 0.038;
    soul.life -= 1;

    const glowRadius = soul.radius * (8 + soul.score / 18) * pulse;
    const glow = fx.createRadialGradient(soul.x, soul.y, 0, soul.x, soul.y, glowRadius);
    glow.addColorStop(0, `rgba(255, 245, 205, ${alpha * 0.72})`);
    glow.addColorStop(0.34, `rgba(255, 115, 148, ${alpha * 0.32})`);
    glow.addColorStop(1, "rgba(109, 93, 242, 0)");
    fx.fillStyle = glow;
    fx.beginPath();
    fx.arc(soul.x, soul.y, glowRadius, 0, Math.PI * 2);
    fx.fill();

    fx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    fx.beginPath();
    fx.arc(soul.x, soul.y, soul.radius * pulse, 0, Math.PI * 2);
    fx.fill();
  }

  const scoreAlpha = alpha * clamp(a.score / 100, 0.35, 1);
  fx.lineCap = "round";
  fx.lineWidth = 2.4 + a.score * 0.035;
  fx.strokeStyle = `rgba(255, 213, 137, ${scoreAlpha})`;
  fx.beginPath();
  fx.moveTo(a.x, a.y);
  fx.bezierCurveTo(mx - 36, my - 86, mx + 36, my - 86, b.x, b.y);
  fx.stroke();

  fx.lineWidth = 1.2;
  fx.strokeStyle = `rgba(255, 126, 169, ${scoreAlpha * 0.75})`;
  fx.beginPath();
  fx.moveTo(a.x, a.y);
  fx.bezierCurveTo(mx - 56, my + 72, mx + 56, my + 72, b.x, b.y);
  fx.stroke();

  if (Math.random() > 0.72) {
    sparks.push({
      x: mx + (Math.random() - 0.5) * 80,
      y: my + (Math.random() - 0.5) * 70,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: 0.8 + Math.random() * 1.8,
      life: 24 + Math.random() * 18,
      maxLife: 42,
      hue: Math.random(),
    });
  }

  fx.restore();

  for (let i = soulStars.length - 1; i >= 0; i -= 1) {
    if (soulStars[i].life <= 0) soulStars.splice(i, 1);
  }
}

function strokeBolt(points, alpha, width, jitter) {
  fx.lineCap = "round";
  fx.lineJoin = "round";

  const warped = points.map((point, index) => {
    if (index === 0 || index === points.length - 1) return point;
    return {
      x: point.x + (Math.random() - 0.5) * jitter,
      y: point.y + (Math.random() - 0.5) * jitter,
    };
  });

  fx.strokeStyle = `rgba(74, 183, 255, ${alpha * 0.16})`;
  fx.lineWidth = width * 8.5;
  fx.beginPath();
  fx.moveTo(warped[0].x, warped[0].y);
  for (let i = 1; i < warped.length; i += 1) fx.lineTo(warped[i].x, warped[i].y);
  fx.stroke();

  fx.strokeStyle = `rgba(136, 226, 255, ${alpha * 0.34})`;
  fx.lineWidth = width * 3.4;
  fx.beginPath();
  fx.moveTo(warped[0].x, warped[0].y);
  for (let i = 1; i < warped.length; i += 1) fx.lineTo(warped[i].x, warped[i].y);
  fx.stroke();

  fx.strokeStyle = `rgba(232, 250, 255, ${alpha * 0.92})`;
  fx.lineWidth = Math.max(1, width * 1.05);
  fx.beginPath();
  fx.moveTo(warped[0].x, warped[0].y);
  for (let i = 1; i < warped.length; i += 1) fx.lineTo(warped[i].x, warped[i].y);
  fx.stroke();

  fx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  fx.lineWidth = Math.max(0.7, width * 0.32);
  fx.beginPath();
  fx.moveTo(warped[0].x, warped[0].y);
  for (let i = 1; i < warped.length; i += 1) fx.lineTo(warped[i].x, warped[i].y);
  fx.stroke();
}

function paintLightnings() {
  for (let i = lightnings.length - 1; i >= 0; i -= 1) {
    const bolt = lightnings[i];
    bolt.life -= 1;
    const alpha = clamp(bolt.life / bolt.maxLife, 0, 1);
    const flicker = Math.random() > 0.18 ? 0.72 + Math.random() * 0.28 : 0.22;

    strokeBolt(bolt.points, alpha * flicker, bolt.width, bolt.jitter);
    for (const branch of bolt.branches) {
      strokeBolt(branch, alpha * 0.52 * flicker, bolt.width * 0.34, bolt.jitter * 1.2);
    }

    if (bolt.life <= 0) lightnings.splice(i, 1);
  }

  if (stormFlash > 0.01) {
    fx.fillStyle = `rgba(206, 239, 255, ${stormFlash})`;
    fx.fillRect(0, 0, effectsCanvas.width, effectsCanvas.height);
    stormFlash *= 0.58;
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
  paintSoulStars(time);
  paintWells(time);
  paintLightnings();

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

  if (sim.idlePulse % 360 === 0 && pointers.size === 0 && Math.random() > 0.45) {
    const x = window.innerWidth * (0.18 + Math.random() * 0.64);
    const y = window.innerHeight * (0.22 + Math.random() * 0.52);
    addSkyStrike(x, y, 0.58);
  }

  requestAnimationFrame(animate);
}

function onPointerDown(event) {
  fieldCanvas.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  createWell(event.pointerId, event.clientX, event.clientY);
  disturb(event.clientX, event.clientY, 1050, 1.3);
  addSkyStrike(event.clientX, event.clientY, 0.82);
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
    if (Math.random() > 0.62) addLightning(last.x, last.y, event.clientX, event.clientY, power * 0.42);
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
againButton.addEventListener("click", () => {
  const x = window.innerWidth * (0.35 + Math.random() * 0.3);
  const y = window.innerHeight * (0.32 + Math.random() * 0.24);
  disturb(x, y, 980, 1.2);
  addSkyStrike(x, y, 0.95);
  burst(x, y, 1.25);
  if (nameAInput.value.trim() && nameBInput.value.trim()) {
    revealLoveFortune(x, y, 1.4 + Math.random() * 0.9);
  } else {
    revealFortune(x, y, 1.4 + Math.random() * 0.9);
  }
});
loveForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const x = window.innerWidth * 0.5;
  const y = window.innerHeight * 0.44;
  disturb(x, y, 1120, 1.35);
  revealLoveFortune(x, y, 1.8);
});

requestAnimationFrame(animate);
