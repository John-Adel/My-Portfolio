(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    } catch (err) { }
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
     Reveal on Scroll (Apple style fade-up)
     ========================================================= */
  const revealElements = document.querySelectorAll(".reveal-up");
  if (revealElements.length && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    revealElements.forEach(el => revealObserver.observe(el));
  } else if (prefersReducedMotion) {
    revealElements.forEach(el => el.classList.add("active"));
  }

  /* =========================================================
     Credentials carousel
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
     Dynamic Skills Graph (Apple-style smooth draw)
     ========================================================= */
  const skillsData = [
    { name: 'Pandas', val: 80 }, { name: 'SQL', val: 80 },
    { name: 'Python', val: 70 }, { name: 'Git', val: 70 },
    { name: 'NumPy', val: 60 }, { name: 'Seaborn', val: 60 },
    { name: 'Matplotlib', val: 55 }, { name: 'Scikit-learn', val: 50 },
    { name: 'R', val: 40 }, { name: 'Plotly', val: 35 },
    { name: 'Tableau', val: 30 }
  ];

  const graphContainer = document.getElementById("skills-graph-container");
  const svgPath = document.getElementById("skills-path");
  const nodesContainer = document.getElementById("skills-nodes");
  let graphDrawn = false;

  function renderSkillsGraph() {
    if (!graphContainer || !svgPath || !nodesContainer) return;
    
    // Clear old nodes
    nodesContainer.innerHTML = '';
    
    const width = graphContainer.clientWidth;
    const height = graphContainer.clientHeight;
    
    // Assign random X distribution ensuring they don't overlap too badly
    // by dividing the width into segments and adding a small random jitter
    const segments = skillsData.length;
    let mappedSkills = skillsData.map((skill, index) => {
      const basePercentage = (index / (segments - 1)) * 90 + 5; // 5% to 95% mapping
      // Add slight random jitter (-2% to +2%) but keep within bounds
      let xPercent = basePercentage + (Math.random() * 4 - 2); 
      xPercent = Math.max(2, Math.min(98, xPercent)); 
      
      return {
        ...skill,
        x: (xPercent / 100) * width,
        y: ((100 - skill.val) / 100) * height
      };
    });

    // Generate smooth cubic bezier path string
    let d = `M ${mappedSkills[0].x},${mappedSkills[0].y}`;
    for (let i = 1; i < mappedSkills.length; i++) {
      const curr = mappedSkills[i];
      const prev = mappedSkills[i - 1];
      const midX = (prev.x + curr.x) / 2;
      d += ` C ${midX},${prev.y} ${midX},${curr.y} ${curr.x},${curr.y}`;
    }
    svgPath.setAttribute("d", d);

    // Render HTML nodes for hover/text context
    mappedSkills.forEach((skill, index) => {
      const nodeWrapper = document.createElement("div");
      nodeWrapper.className = "absolute";
      nodeWrapper.style.left = `${skill.x}px`;
      nodeWrapper.style.top = `${skill.y}px`;

      const point = document.createElement("div");
      point.className = "skill-node-point absolute w-3 h-3 bg-surface border-2 border-accent rounded-full z-20";
      point.style.transitionDelay = `${index * 100}ms`;

      const label = document.createElement("span");
      label.className = "skill-node-label absolute whitespace-nowrap text-xs font-medium text-ink-muted mt-3 z-10";
      label.innerText = `${skill.name} (${skill.val}%)`;
      label.style.transitionDelay = `${(index * 100) + 200}ms`;

      nodeWrapper.appendChild(point);
      nodeWrapper.appendChild(label);
      nodesContainer.appendChild(nodeWrapper);
    });

    return mappedSkills;
  }

  function animateGraph() {
    if (graphDrawn || !svgPath) return;
    graphDrawn = true;

    const length = svgPath.getTotalLength();
    svgPath.style.strokeDasharray = length;
    svgPath.style.strokeDashoffset = length;

    if (!prefersReducedMotion) {
      svgPath.style.transition = "stroke-dashoffset 2s cubic-bezier(0.25, 1, 0.5, 1)";
      // Trigger reflow
      svgPath.getBoundingClientRect();
      svgPath.style.strokeDashoffset = "0";
    } else {
      svgPath.style.strokeDashoffset = "0";
    }

    // Animate nodes
    const points = document.querySelectorAll('.skill-node-point');
    const labels = document.querySelectorAll('.skill-node-label');
    points.forEach(p => p.classList.add('active'));
    labels.forEach(l => l.classList.add('active'));
  }

  // Draw initially and on resize
  window.addEventListener('resize', () => {
    if (graphContainer && graphDrawn) {
      svgPath.style.transition = 'none'; // disable transition during resize
      renderSkillsGraph();
      animateGraph(); // re-trigger node states
    }
  });

  if (graphContainer) {
    renderSkillsGraph();
    const graphObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateGraph();
          graphObserver.disconnect();
        }
      });
    }, { threshold: 0.3 });
    graphObserver.observe(graphContainer);
  }

  /* =========================================================
     Hero background: sparse data-node network on canvas
     ========================================================= */
  const canvas = document.getElementById("node-canvas");
  const ctx = canvas.getContext("2d");
  const heroSection = document.getElementById("hero");

  let nodes = [];
  let width = 0;
  let height = 0;
  let running = false;
  let lastFrameTime = 0;
  const FRAME_INTERVAL = 1000 / 30;
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
    buildNodes();
    ctx.clearRect(0, 0, width, height);
    const color = getNodeColor();
    nodes.forEach(function (n) {
      ctx.fillStyle = "rgba(" + color + ", 0.4)";
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
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