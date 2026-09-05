(function () {
  "use strict";

  /* =========================================================
     Theme toggle (persists via localStorage; safe if blocked)
     ========================================================= */
  const root = document.documentElement;
  const toggleBtn = document.getElementById("theme-toggle");
  const iconSun = document.getElementById("icon-sun");
  const iconMoon = document.getElementById("icon-moon");

  function readStoredTheme() {
    try {
      return window.localStorage.getItem("portfolio-theme");
    } catch (err) {
      return null;
    }
  }

  function storeTheme(value) {
    try {
      window.localStorage.setItem("portfolio-theme", value);
    } catch (err) {
      /* storage unavailable — theme just won't persist across reloads */
    }
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    const isDark = theme === "dark";
    iconMoon.classList.toggle("hidden", !isDark);
    iconSun.classList.toggle("hidden", isDark);
  }

  const stored = readStoredTheme();
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  applyTheme(stored || (prefersLight ? "light" : "dark"));

  toggleBtn.addEventListener("click", function () {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    storeTheme(next);
  });

  /* =========================================================
     Mobile nav
     ========================================================= */
  const navToggle = document.getElementById("nav-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  navToggle.addEventListener("click", function () {
    const isOpen = !mobileMenu.classList.contains("hidden");
    mobileMenu.classList.toggle("hidden", isOpen);
    navToggle.setAttribute("aria-expanded", String(!isOpen));
  });

  mobileMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mobileMenu.classList.add("hidden");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* =========================================================
     Credentials carousel: native scroll-snap, buttons scroll it
     ========================================================= */
  const track = document.getElementById("credentials-track");
  const prevBtn = document.getElementById("credentials-prev");
  const nextBtn = document.getElementById("credentials-next");

  if (track && prevBtn && nextBtn) {
    function scrollByCard(direction) {
      const card = track.querySelector(".credential-card");
      const amount = card ? card.getBoundingClientRect().width + 24 : 300;
      track.scrollBy({ left: direction * amount, behavior: "smooth" });
    }
    prevBtn.addEventListener("click", function () { scrollByCard(-1); });
    nextBtn.addEventListener("click", function () { scrollByCard(1); });
  }

  /* =========================================================
     Skills matrix: scroll-triggered progress bars
     ========================================================= */
  const skillItems = document.querySelectorAll(".skill-item");

  if (skillItems.length) {
    const skillObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const item = entry.target;
          const fill = item.querySelector(".skill-fill");
          const percent = item.getAttribute("data-skill-percent");
          if (fill && percent) {
            fill.style.width = percent + "%";
          }
          obs.unobserve(item);
        });
      },
      { threshold: 0.4 }
    );

    skillItems.forEach(function (item) {
      skillObserver.observe(item);
    });
  }

  /* =========================================================
     Hero background: sparse data-node network on canvas
     - capped frame rate, paused off-screen, reduced-motion aware
     ========================================================= */
  const canvas = document.getElementById("node-canvas");
  const ctx = canvas.getContext("2d");
  const heroSection = document.getElementById("hero");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let nodes = [];
  let width = 0;
  let height = 0;
  let running = false;
  let lastFrameTime = 0;
  const FRAME_INTERVAL = 1000 / 30; // cap at ~30fps
  const LINK_DISTANCE = 150;

  function nodeCountForViewport() {
    if (width < 640) return 12;
    if (width < 1024) return 18;
    return 26;
  }

  function resize() {
    width = heroSection.clientWidth;
    height = heroSection.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    buildNodes();
  }

  function buildNodes() {
    const count = nodeCountForViewport();
    nodes = Array.from({ length: count }, function () {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
      };
    });
  }

  function getNodeColor() {
    const style = getComputedStyle(root);
    return style.getPropertyValue("--node-color").trim() || "45, 212, 191";
  }

  function drawFrame() {
    const color = getNodeColor();
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0 || a.x > width) a.vx *= -1;
      if (a.y < 0 || a.y > height) a.vy *= -1;

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DISTANCE) {
          const alpha = (1 - dist / LINK_DISTANCE) * 0.35;
          ctx.strokeStyle = "rgba(" + color + ", " + alpha.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = "rgba(" + color + ", 0.55)";
      ctx.beginPath();
      ctx.arc(a.x, a.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawStaticFrame() {
    // Reduced motion: render one still frame, no animation loop.
    buildNodes();
    ctx.clearRect(0, 0, width, height);
    const color = getNodeColor();
    nodes.forEach(function (n) {
      ctx.fillStyle = "rgba(" + color + ", 0.4)";
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function loop(timestamp) {
    if (!running) return;
    if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
      lastFrameTime = timestamp;
      drawFrame();
    }
    requestAnimationFrame(loop);
  }

  function start() {
    if (running || prefersReducedMotion) return;
    running = true;
    requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
  }

  window.addEventListener("resize", resize);
  resize();

  if (prefersReducedMotion) {
    drawStaticFrame();
  } else {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            start();
          } else {
            stop();
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(heroSection);
  }
})();
