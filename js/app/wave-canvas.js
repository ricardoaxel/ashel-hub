import { hexToRgb } from './colors.js';

export function initWaveCanvas(getHeroColors) {
  const canvas = document.getElementById('wave-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let animationId;
  let time = 0;
  let mouseX = 0.5;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth;
  });

  const bands = 128;
  const frequencies = new Float32Array(bands).fill(0);
  const targetFrequencies = new Float32Array(bands).fill(0);

  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * canvas.height;
    }
    reset() {
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.45;
      this.x = cx + (Math.random() - 0.5) * canvas.width * 0.6;
      this.y = cy + (Math.random() - 0.5) * canvas.height * 0.5;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3 - 0.1;
      this.radius = Math.random() * 2 + 0.5;
      this.opacity = Math.random() * 0.4 + 0.1;
      this.pulseSpeed = Math.random() * 0.02 + 0.01;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.colorIndex = Math.floor(Math.random() * 3);
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.45;
      const dx = cx - this.x;
      const dy = cy - this.y;
      this.vx += dx * 0.00003;
      this.vy += dy * 0.00003;
      this.vx *= 0.999;
      this.vy *= 0.999;
      if (this.x < -20 || this.x > canvas.width + 20 || this.y < -20 || this.y > canvas.height + 20)
        this.reset();
    }
    draw(ctx, colors) {
      const pulse = Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.5 + 0.5;
      const r = this.radius * (0.8 + pulse * 0.4);
      const alpha = this.opacity * (0.6 + pulse * 0.4);
      const rgb = hexToRgb(colors[this.colorIndex]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
      ctx.fill();
    }
  }

  let particles = [];
  function initParticles(count) {
    particles = [];
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }
  initParticles(50);
  window.addEventListener('resize', () => {
    resize();
    initParticles(50);
  });

  function generateNextFrame() {
    for (let i = 0; i < bands; i++) {
      const base = Math.sin(time * 0.02 + i * 0.1) * 0.3;
      const noise = (Math.random() - 0.5) * 0.2;
      const beat = Math.sin(time * 0.05) * 0.4 * (i < 20 ? 1 : 0.3);
      const harmonic = Math.sin(i * 0.3 + time * 0.03) * 0.2;
      const mouseInfluence = Math.sin(i * 0.05 + mouseX * Math.PI * 2) * 0.3;
      targetFrequencies[i] = Math.max(
        0,
        Math.min(1, base + noise + beat + harmonic + mouseInfluence + 0.5)
      );
    }
  }

  function updateFrequencies() {
    for (let i = 0; i < bands; i++) {
      frequencies[i] += (targetFrequencies[i] - frequencies[i]) * 0.15;
    }
  }

  function drawWaveform() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerY = canvas.height * 0.45;
    const amplitude = canvas.height * 0.25;
    ctx.globalCompositeOperation = 'lighter';
    const colors = getHeroColors();
    const opacities = [0.3, 0.2, 0.15];

    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      const rgb = hexToRgb(colors[layer]);
      ctx.strokeStyle = `rgba(${rgb}, ${opacities[layer]})`;
      ctx.lineWidth = layer === 0 ? 2 : 1;
      const yShift = layer * 15;
      const phaseShift = layer * 0.5;

      for (let x = 0; x < canvas.width; x++) {
        const i = Math.floor((x / canvas.width) * bands);
        const freq = frequencies[i] || 0;
        const wave = Math.sin(x * 0.01 + time * 0.02 + phaseShift) * freq * amplitude;
        const y = centerY + yShift + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    particles.forEach((p) => {
      p.update();
      p.draw(ctx, colors);
    });
  }

  function animate() {
    time++;
    generateNextFrame();
    updateFrequencies();
    drawWaveform();
    animationId = requestAnimationFrame(animate);
  }
  animate();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate();
    }
  });
}
