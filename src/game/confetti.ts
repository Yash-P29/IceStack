// Simple confetti effect using canvas overlay
export const launchConfetti = (durationMs: number = 3000) => {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  const colors = ['#FF3366', '#00E5FF', '#FFD700', '#AA00FF', '#FF6600', '#00FF66', '#3366FF', '#FF69B4'];

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    w: number;
    h: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
  }

  const particles: Particle[] = [];
  const PARTICLE_COUNT = 200;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * -1, // Start above screen
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 2,
      w: Math.random() * 10 + 4,
      h: Math.random() * 6 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    });
  }

  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > durationMs) {
      document.body.removeChild(canvas);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fade out in last 500ms
    const fadeStart = durationMs - 500;
    const globalAlpha = elapsed > fadeStart ? 1 - ((elapsed - fadeStart) / 500) : 1;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.rotation += p.rotationSpeed;
      p.vx *= 0.999; // air resistance

      ctx.save();
      ctx.globalAlpha = globalAlpha * p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();

      // Reset particles that go off-screen bottom
      if (p.y > canvas.height + 20) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
        p.vy = Math.random() * 4 + 2;
      }
    }

    requestAnimationFrame(animate);
  };

  animate();
};
