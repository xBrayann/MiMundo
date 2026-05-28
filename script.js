/* ========================================
   Mi Mundo – Lógica principal
   ======================================== */

// --- Referencias al DOM ---
const siBtn = document.getElementById('si');
const noBtn = document.getElementById('no');
const titulo = document.getElementById('titulo');
const msg = document.getElementById('mensaje');
const botones = document.querySelector('.botones');
const regalo = document.getElementById('regalo');
const galaxia = document.getElementById('galaxia');
let siRect, tituloRect;

// --- Posicionar botones al cargar y al cambiar tamaño ---
function posicionarBotones() {
  // Resetear posición para obtener el rect correcto
  siBtn.style.position = '';
  noBtn.style.position = '';
  siBtn.style.left = '';
  siBtn.style.top = '';
  noBtn.style.left = '';
  noBtn.style.top = '';

  siRect     = siBtn.getBoundingClientRect();
  tituloRect = titulo.getBoundingClientRect();

  siBtn.style.position = 'fixed';
  siBtn.style.left     = siRect.left + 'px';
  siBtn.style.top      = siRect.top  + 'px';
  siBtn.style.zIndex   = 20;

  noBtn.style.position = 'fixed';
  noBtn.style.left     = (siRect.right + 5) + 'px';
  noBtn.style.top      = siRect.top + 'px';
}

document.addEventListener('DOMContentLoaded', posicionarBotones);
window.addEventListener('resize', posicionarBotones);

// --- Botón "No" se escapa ---
function moverNo() {
  const bw = noBtn.offsetWidth;
  const bh = noBtn.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = Math.min(20, vw * 0.03);
  const minY = Math.min(100, vh * 0.15);
  let x, y;
  do {
    x = Math.random() * (vw - bw - margin * 2) + margin;
    y = Math.random() * (vh - bh - margin * 2) + margin;
  } while (y < minY);

  noBtn.style.transition = 'left .8s ease, top .8s ease';
  noBtn.style.left = `${x}px`;
  noBtn.style.top  = `${y}px`;
}

noBtn.addEventListener('mouseenter', moverNo);
noBtn.addEventListener('touchstart', moverNo);

// --- Botón "Sí": mostrar mensaje y regalo ---
siBtn.addEventListener('click', () => {
  titulo.style.opacity = '0';
  titulo.style.transform = 'translateY(-20px)';
  botones.style.display = 'none';
  msg.style.display = 'block';

  setTimeout(() => {
    msg.style.opacity = '1';
    msg.classList.add('latido');
  }, 50);

  lanzarCorazones();

  setTimeout(() => {
    msg.classList.add('sube');
    regalo.style.display = 'block';
    regalo.classList.add('brillo');
  }, 2000);
});

// --- Abrir regalo → iniciar galaxia ---
regalo.addEventListener('click', () => {
  regalo.classList.remove('brillo');
  document.body.style.background = '#000';
  document.getElementById('contenido').style.display = 'none';
  msg.style.display = 'none';
  regalo.style.display = 'none';
  galaxia.style.display = 'block';
  iniciarGalaxia();
});

// --- Lanzar corazones flotantes ---
function lanzarCorazones() {
  for (let i = 0; i < 25; i++) {
    const c = document.createElement('div');
    c.className = 'corazon';
    c.textContent = '💖';
    c.style.left = Math.random() * window.innerWidth + 'px';
    c.style.top = window.innerHeight + 'px';
    c.style.fontSize = (18 + Math.random() * 26) + 'px';
    c.style.animationDuration = (3 + Math.random() * 3) + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 6000);
  }
}

/* ========================================
   🌌 Galaxia interactiva (Three.js)
   ======================================== */
function iniciarGalaxia() {
  // --- Reproductor de audio ---
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('play');
  const progress = document.getElementById('progress');
  const progressBar = document.getElementById('progress-bar');
  const timeDisplay = document.getElementById('time');
  let isPlaying = false;

  playBtn.addEventListener('click', async () => {
    if (isPlaying) {
      audio.pause();
      playBtn.textContent = '▶️';
      isPlaying = false;
    } else {
      try {
        await audio.play();
        playBtn.textContent = '⏸️';
        isPlaying = true;
      } catch (e) {
        console.error('Error reproduciendo audio:', e);
      }
    }
  });

  audio.addEventListener('waiting', () => { playBtn.textContent = '⏳'; });
  audio.addEventListener('playing', () => { if (isPlaying) playBtn.textContent = '⏸️'; });

  function formatTime(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return m + ':' + s;
  }

  audio.addEventListener('timeupdate', () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = (isFinite(percent) ? percent : 0) + '%';
    timeDisplay.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
  });

  progress.addEventListener('click', (e) => {
    const rect = progress.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    if (isFinite(audio.duration)) audio.currentTime = percent * audio.duration;
  });

  // --- Escena Three.js ---
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 5000);
  let targetDist = 700;
  let currentDist = 700;
  let rotX = 0.25;
  let rotY = 0;

  // --- Fondo nebulosa ---
  const loader = new THREE.TextureLoader();
  const nebulaTex = loader.load(
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/cube/space/px.jpg'
  );
  scene.background = nebulaTex;

  // --- Estrellas ---
  (function makeStars(count = 2000, spread = 3000) {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = spread * (0.3 + Math.random() * 0.7);
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3 + 0] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({
      size: 1.5, color: 0xffffff, depthWrite: false
    })));
  })();

  // --- Núcleo central ---
  const coreMat = new THREE.MeshPhongMaterial({
    color: 0x111111, transparent: true, opacity: 0.6, shininess: 200
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(40, 64, 64), coreMat);
  scene.add(core);

  // --- Texto central "TE AMO ❤️" ---
  function makeCenterTextTexture(text) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff0033';
    ctx.shadowColor = '#ff66aa';
    ctx.shadowBlur = 50;
    ctx.fillText(text, c.width / 2, c.height / 2);
    return new THREE.CanvasTexture(c);
  }

  const centerTex = makeCenterTextTexture('TE AMO ❤️');
  const centerMat = new THREE.SpriteMaterial({ map: centerTex, transparent: true });
  const centerSprite = new THREE.Sprite(centerMat);
  centerSprite.scale.set(60, 60, 1);
  scene.add(centerSprite);

  // --- Resplandor central ---
  function makeGlow(size = 768, c1 = '255,0,0', c2 = '180,0,0') {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(size / 2, size / 2, size * 0.05,
      size / 2, size / 2, size * 0.5);
    grad.addColorStop(0, 'rgba(' + c1 + ',0.9)');
    grad.addColorStop(0.5, 'rgba(' + c2 + ',0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeGlow(), transparent: true, depthWrite: false })
  );
  glow.scale.set(500, 500, 1);
  scene.add(glow);

  // --- Anillos ---
  function ringTexture(size = 768) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.translate(size / 2, size / 2);
    const r1 = size * 0.34;
    const r2 = size * 0.49;
    const grd = g.createRadialGradient(0, 0, r1 * 0.3, 0, 0, r2);
    grd.addColorStop(0.0, 'rgba(255,200,200,1)');
    grd.addColorStop(0.3, 'rgba(255,30,30,0.9)');
    grd.addColorStop(0.65, 'rgba(180,0,0,0.6)');
    grd.addColorStop(1.0, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(0, 0, r2, 0, Math.PI * 2);
    g.arc(0, 0, r1, 0, Math.PI * 2, true);
    g.closePath();
    g.fill();
    return new THREE.CanvasTexture(c);
  }

  const ring1 = new THREE.Mesh(
    new THREE.RingGeometry(60, 80, 128),
    new THREE.MeshBasicMaterial({ map: ringTexture(), transparent: true, side: THREE.DoubleSide })
  );
  const ring2 = new THREE.Mesh(
    new THREE.RingGeometry(85, 100, 128),
    new THREE.MeshBasicMaterial({ map: ringTexture(), transparent: true, side: THREE.DoubleSide, opacity: 0.6 })
  );
  ring1.rotation.x = ring2.rotation.x = Math.PI / 2;
  scene.add(ring1);
  scene.add(ring2);

  // --- Palabras orbitantes ---
  const WORDS = [];
  const baseWords = [
    '💖 Mi amor', '🌞 Mi sol', '🌎 Mi mundo', '✨ Brillas',
    '❤️ Te amo', '🌌 Mi universo', '👑 Mi sueño', '🌠 Estrella',
    '💫 Mi cielo', '💕 Mi chaparrita', '🎶 Tu risa',
    '🌹 Amor eterno', '💎 Eres todo', '🌈 Alegría',
    '🎁 Mi razón', '🥰 Mi vida'
  ];
  for (let i = 0; i < 5; i++) WORDS.push(...baseWords);

  function makeWordTexture(text, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 60px Arial';
    const textWidth = ctx.measureText(text).width + 60;
    canvas.width = textWidth;
    canvas.height = 120;

    const ctx2 = canvas.getContext('2d');
    ctx2.font = 'bold 60px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = '#fff';
    ctx2.shadowColor = color;
    ctx2.shadowBlur = 35;
    ctx2.fillText(text, canvas.width / 2, canvas.height / 2);
    return new THREE.CanvasTexture(canvas);
  }

  const COLORS = [
    '#ff66ff', '#66ccff', '#ffd36b', '#ff9966', '#8df59a',
    '#ffa0f8', '#c6a7ff', '#ff4444', '#44ff99', '#99ccff'
  ];
  const textGroup = new THREE.Group();
  scene.add(textGroup);

  for (let i = 0; i < WORDS.length; i++) {
    const tex = makeWordTexture(WORDS[i], COLORS[i % COLORS.length]);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sp = new THREE.Sprite(mat);
    const aspect = tex.image.width / tex.image.height;
    sp.scale.set(40 * aspect, 40, 1);

    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = 220 + Math.random() * 200;
    sp.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
    sp.userData = { phi, theta, radius: r, speed: 0.0008 + Math.random() * 0.0012 };
    textGroup.add(sp);
  }

  // --- Controles de arrastre ---
  let dragging = false, lastX = 0, lastY = 0;

  function onDown(e) {
    dragging = true;
    const t = e.touches ? e.touches[0] : e;
    lastX = t.clientX;
    lastY = t.clientY;
  }
  function onMove(e) {
    if (!dragging) return;
    const t = e.touches ? e.touches[0] : e;
    const dx = (t.clientX - lastX) / innerWidth;
    const dy = (t.clientY - lastY) / innerHeight;
    rotY -= dx * 3;
    rotX = Math.max(-1.2, Math.min(1.2, rotX - dy * 2.2));
    lastX = t.clientX;
    lastY = t.clientY;
  }
  function onUp() { dragging = false; }

  addEventListener('mousedown', onDown);
  addEventListener('mousemove', onMove);
  addEventListener('mouseup', onUp);
  addEventListener('touchstart', onDown, { passive: true });
  addEventListener('touchmove', onMove, { passive: true });
  addEventListener('touchend', onUp, { passive: true });

  // --- 🔍 Zoom con pellizco (móviles) ---
  let pinch = 0;
  addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      if (pinch) {
        targetDist += (pinch - d) * 0.5;
        targetDist = Math.max(60, Math.min(2000, targetDist));
      }
      pinch = d;
    }
  }, { passive: false });

  addEventListener('touchend', () => { pinch = 0; }, { passive: true });

  // --- Zoom con rueda del ratón ---
  addEventListener('wheel', (e) => {
    targetDist += e.deltaY * 0.25;
    targetDist = Math.max(80, Math.min(900, targetDist));
  }, { passive: true });

  // --- Redimensionar canvas al cambiar tamaño de ventana ---
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // --- Loop de animación ---
  let t = 0;
  function tick() {
    requestAnimationFrame(tick);
    t += 0.01;

    ring1.rotation.z += 0.002;
    ring2.rotation.z -= 0.0015;

    glow.scale.set(
      500 * (1 + Math.sin(t * 0.4) * 0.03),
      500 * (1 + Math.sin(t * 0.4) * 0.03),
      1
    );

    const s = 1.0 + 0.05 * Math.sin(t * 3);
    core.scale.set(s, s, s);

    textGroup.children.forEach(sp => {
      sp.userData.theta += sp.userData.speed;
      sp.position.x = sp.userData.radius * Math.sin(sp.userData.phi) * Math.cos(sp.userData.theta);
      sp.position.z = sp.userData.radius * Math.sin(sp.userData.phi) * Math.sin(sp.userData.theta);
    });

    currentDist += (targetDist - currentDist) * 0.06;
    const cx = Math.cos(rotX), sx = Math.sin(rotX);
    const cy = Math.cos(rotY), sy = Math.sin(rotY);
    camera.position.set(currentDist * sy * cx, currentDist * sx, currentDist * cy * cx);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  tick();
}
