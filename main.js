/* ======================================
   LUEM — main.js
   GSAP + ScrollTrigger 전체 인터랙션
====================================== */

gsap.registerPlugin(ScrollTrigger);

/* ─── 공통 유틸 ─── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ======================================
   1. 커스텀 커서
====================================== */
const cursor   = qs('#cursor');
const follower = qs('#cursorFollower');
let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  gsap.set(cursor, { x: mouseX, y: mouseY }); // 즉시 이동 — 지연 없음
});

// 팔로워 부드러운 래그 (lerp 0.18 = 적당한 부드러움, 빠른 반응)
(function animateFollower() {
  followerX += (mouseX - followerX) * 0.15;
  followerY += (mouseY - followerY) * 0.15;
  gsap.set(follower, { x: followerX, y: followerY });
  requestAnimationFrame(animateFollower);
})();

// 호버 시 커서 확장
qsa('a, button, .col-item, .gallery-item, .hero-candle-visual').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

/* ======================================
   2. 네비게이션 스크롤 감지
====================================== */
const nav = qs('#nav');
ScrollTrigger.create({
  start: 'top -60px',
  onUpdate: self => {
    nav.classList.toggle('scrolled', self.progress > 0);
  }
});

/* ======================================
   3. HERO 입장 애니메이션 (키네틱 타이포)
====================================== */
// main.js가 </body> 직전에 로드되므로 DOMContentLoaded는 이미 발생 → 즉시 실행
(function heroInit() {

  // 타이틀 줄 단위 마스크 reveal
  const heroLines = qsa('.hero-title .reveal-line');
  const tl = gsap.timeline({ delay: 0.2 });

  // hero-sub 텍스트
  const heroSub = qs('.hero-sub');
  if (heroSub) {
    heroSub.innerHTML = `<span class="hero-sub-inner">${heroSub.textContent}</span>`;
    tl.from('.hero-sub-inner', {
      y: '100%',
      duration: 0.9,
      ease: 'power3.out'
    });
  }

  // 타이틀 각 줄
  heroLines.forEach(line => {
    const text = line.textContent;
    line.innerHTML = `<span style="display:block">${text}</span>`;
  });

  tl.from('.hero-title .reveal-line > span', {
    y: '110%',
    duration: 1.1,
    stagger: 0.18,
    ease: 'power4.out'
  }, '-=0.5');

  // 설명 텍스트, 버튼
  tl.from('.hero-desc', { opacity: 0, y: 24, duration: 0.8, ease: 'power3.out' }, '-=0.6');
  tl.from('.hero-btn',  { opacity: 0, y: 24, duration: 0.7, ease: 'power3.out' }, '-=0.5');

  // 캔들 등장
  tl.to('#heroCandle', { opacity: 1, duration: 0.1 }, '-=1.2');
  tl.from('#heroCandle', {
    x: 60,
    duration: 1.4,
    ease: 'power3.out'
  }, '-=1.2');

  // 캔들 glow 깜빡임 (불꽃)
  gsap.to('#candleGlow', {
    opacity: 1,
    scale: 1.3,
    duration: 0.8,
    ease: 'power2.inOut',
    repeat: -1,
    yoyo: true,
    delay: 1.5
  });

  // 뚜껑이 살짝 떠있다가 내려오는 효과
  tl.from('#candleLid', {
    y: -24,
    duration: 1.2,
    ease: 'elastic.out(1, 0.6)'
  }, '-=1.0');
})(); // heroInit

/* ======================================
   4. 제품 상세 — Three.js 3D 캔들
====================================== */
(function initCandleThree() {

  // Three.js는 <head>에서 동기 로드됨 → 즉시 실행
  (function() {

    const canvas  = qs('#candleCanvas');
    const W = canvas.offsetWidth, H = canvas.offsetHeight;

    /* ── 렌더러 ── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    /* ── 씬 ── */
    const scene = new THREE.Scene();

    /* ── 카메라 ── */
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(0, 0.5, 5.5);

    /* ── 조명 ── */
    const ambient = new THREE.AmbientLight(0xF5ECD5, 0.35);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xFFE4B0, 2.2);
    keyLight.position.set(3, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xB0C8E8, 0.6);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);

    const flameLight = new THREE.PointLight(0xFF9C30, 2.5, 6);
    flameLight.position.set(0, 1.15, 0);
    scene.add(flameLight);

    const fillLight = new THREE.PointLight(0xC9973A, 0.4, 8);
    fillLight.position.set(0, -3, 1);
    scene.add(fillLight);

    /* ── 환경맵 ── */
    const pmremGen = new THREE.PMREMGenerator(renderer);
    pmremGen.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x100C06);
    [
      [3, 3, 3, 0xFFD080, 1.5],
      [-3, 1, -2, 0x8090FF, 0.5],
      [0, -2, 2, 0xC9973A, 0.8],
    ].forEach(([x,y,z,col,i]) => {
      const l = new THREE.PointLight(col, i, 20);
      l.position.set(x,y,z);
      envScene.add(l);
      envScene.add(new THREE.AmbientLight(0x202010, 0.5));
    });
    const envTex = pmremGen.fromScene(envScene).texture;
    scene.environment = envTex;
    pmremGen.dispose();

    /* ── 머티리얼 ── */
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xB8915A, roughness: 0.62, metalness: 0.0,
      envMapIntensity: 0.5,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xEEE8DC,
      roughness: 0.04, metalness: 0.0,
      transmission: 0.72,
      thickness: 0.5,
      ior: 1.48,
      transparent: true, opacity: 0.90,
      envMapIntensity: 2.0,
      side: THREE.DoubleSide,
    });

    const glassRimMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.0, metalness: 0.0,
      transparent: true, opacity: 0.10,
      envMapIntensity: 3.0,
    });

    const waxMat = new THREE.MeshStandardMaterial({
      color: 0xECDFBE, roughness: 0.88, metalness: 0.0,
      envMapIntensity: 0.2,
    });

    const waxTopMat = new THREE.MeshStandardMaterial({
      color: 0xE2D0A0, roughness: 0.55, metalness: 0.0,
      envMapIntensity: 0.6,
    });

    const labelMat = new THREE.MeshStandardMaterial({
      color: 0xF8F3EB, roughness: 0.92, metalness: 0.0,
    });

    const labelBorderMat = new THREE.MeshStandardMaterial({
      color: 0xC9973A, roughness: 0.25, metalness: 0.8,
      envMapIntensity: 1.5,
    });

    const wickMat = new THREE.MeshStandardMaterial({
      color: 0x4A3520, roughness: 1.0,
    });

    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xFFA020,
      emissive: 0xFF6000, emissiveIntensity: 3.0,
      roughness: 1.0, transparent: true, opacity: 0.88,
      depthWrite: false, side: THREE.DoubleSide,
    });

    const flameCoreMat = new THREE.MeshStandardMaterial({
      color: 0xFFF5CC,
      emissive: 0xFFEE88, emissiveIntensity: 5.0,
      roughness: 1.0, transparent: true, opacity: 0.95,
      depthWrite: false,
    });

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xFF8800,
      emissive: 0xFF5500, emissiveIntensity: 1.2,
      transparent: true, opacity: 0.10,
      depthWrite: false, side: THREE.BackSide,
    });

    const baseRingMat = new THREE.MeshStandardMaterial({
      color: 0x9A7A48, roughness: 0.4, metalness: 0.3,
      envMapIntensity: 1.0,
    });

    /* ── 지오메트리 & 메쉬 ── */
    const group = new THREE.Group();
    scene.add(group);

    // 유리 몸통 — 높이 2.8 → 2.0으로 단축, y 중심 조정
    const glassGeo = new THREE.CylinderGeometry(0.74, 0.74, 2.0, 80, 1, true);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.y = 0.0;
    glassMesh.castShadow = true; glassMesh.receiveShadow = true;
    group.add(glassMesh);

    const glassRimGeo = new THREE.CylinderGeometry(0.745, 0.745, 2.02, 80, 1, true);
    const glassRimMesh = new THREE.Mesh(glassRimGeo, glassRimMat);
    glassRimMesh.position.y = 0.0;
    group.add(glassRimMesh);

    // 유리 바닥 — 몸통에 딱 붙도록
    const bottomGeo = new THREE.CylinderGeometry(0.74, 0.74, 0.10, 64);
    const bottomMesh = new THREE.Mesh(bottomGeo, glassMat);
    bottomMesh.position.y = -1.05;
    group.add(bottomMesh);

    // 바닥 링 — 바닥면에 밀착
    const baseRingGeo = new THREE.TorusGeometry(0.72, 0.032, 16, 80);
    const baseRingMesh = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRingMesh.rotation.x = Math.PI / 2;
    baseRingMesh.position.y = -1.08;
    group.add(baseRingMesh);

    // 왁스 — 유리 높이(2.0)에 맞춰 내부 채움
    const waxBodyGeo = new THREE.CylinderGeometry(0.67, 0.67, 1.6, 64);
    const waxBodyMesh = new THREE.Mesh(waxBodyGeo, waxMat);
    waxBodyMesh.position.y = -0.2;
    group.add(waxBodyMesh);

    const waxTopGeo = new THREE.CylinderGeometry(0.67, 0.67, 0.04, 64);
    const waxTopMesh = new THREE.Mesh(waxTopGeo, waxTopMat);
    waxTopMesh.position.y = 0.62;
    group.add(waxTopMesh);

    const waxRingGeo = new THREE.TorusGeometry(0.10, 0.028, 12, 40);
    const waxRingMat = new THREE.MeshStandardMaterial({ color: 0xD4C090, roughness: 0.5 });
    const waxRingMesh = new THREE.Mesh(waxRingGeo, waxRingMat);
    waxRingMesh.rotation.x = Math.PI / 2;
    waxRingMesh.position.y = 0.64;
    group.add(waxRingMesh);

    // 라벨
    const labelGeo = new THREE.BoxGeometry(1.02, 0.80, 0.01);
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.set(0, -0.08, 0.742);
    group.add(labelMesh);

    const bW = 1.04, bH = 0.82;
    [[0, bH/2, 'h'],[0, -bH/2, 'h'],[bW/2, 0, 'v'],[-bW/2, 0, 'v']].forEach(([x,y,dir]) => {
      const geo = dir === 'h'
        ? new THREE.BoxGeometry(bW, 0.012, 0.012)
        : new THREE.BoxGeometry(0.012, bH, 0.012);
      const m = new THREE.Mesh(geo, labelBorderMat);
      m.position.set(x, y, 0.748);
      group.add(m);
    });

    // 심지 — 왁스 상단(0.62)에서 자연스럽게 돌출
    const wickGeo = new THREE.CylinderGeometry(0.016, 0.020, 0.18, 10);
    const wickMesh = new THREE.Mesh(wickGeo, wickMat);
    wickMesh.position.y = 0.73;
    group.add(wickMesh);

    // 불꽃
    const mkFlame = (scaleR, scaleH) => {
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const r = Math.sin(t * Math.PI) * scaleR * (1 - t * 0.25);
        pts.push(new THREE.Vector2(r, t * scaleH));
      }
      return new THREE.LatheGeometry(pts, 20);
    };

    const flameMesh = new THREE.Mesh(mkFlame(0.13, 0.55), flameMat);
    flameMesh.position.y = 0.82;
    group.add(flameMesh);

    const coreMesh = new THREE.Mesh(mkFlame(0.065, 0.36), flameCoreMat);
    coreMesh.position.y = 0.85;
    group.add(coreMesh);

    const glowGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.y = 0.95;
    group.add(glowMesh);

    // 뚜껑 그룹
    const lidGroup = new THREE.Group();
    group.add(lidGroup);

    const lidBodyGeo = new THREE.CylinderGeometry(0.78, 0.75, 0.56, 72);
    const lidBodyMesh = new THREE.Mesh(lidBodyGeo, woodMat);
    lidBodyMesh.position.y = 1.51;
    lidBodyMesh.castShadow = true;
    lidGroup.add(lidBodyMesh);

    const lidDomePts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const r = Math.cos(t * Math.PI * 0.5) * 0.78;
      const y = Math.sin(t * Math.PI * 0.5) * 0.18;
      lidDomePts.push(new THREE.Vector2(r, y));
    }
    const lidDomeGeo = new THREE.LatheGeometry(lidDomePts, 72);
    const lidDomeMesh = new THREE.Mesh(lidDomeGeo, woodMat);
    lidDomeMesh.position.y = 1.78;
    lidGroup.add(lidDomeMesh);

    const knobGeo = new THREE.SphereGeometry(0.065, 20, 20);
    const knobMesh = new THREE.Mesh(knobGeo, baseRingMat);
    knobMesh.position.y = 1.97;
    lidGroup.add(knobMesh);

    const lidInnerGeo = new THREE.CylinderGeometry(0.71, 0.71, 0.18, 64);
    const lidInnerMesh = new THREE.Mesh(lidInnerGeo, woodMat);
    lidInnerMesh.position.y = 1.24;
    lidGroup.add(lidInnerMesh);

    const lidBandGeo = new THREE.TorusGeometry(0.765, 0.022, 12, 72);
    const lidBandMesh = new THREE.Mesh(lidBandGeo, baseRingMat);
    lidBandMesh.rotation.x = Math.PI / 2;
    lidBandMesh.position.y = 1.51;
    lidGroup.add(lidBandMesh);


    // 반사된 캔들 복사본
    const mirrorGroup = group.clone();
    mirrorGroup.scale.y = -0.18;
    mirrorGroup.position.y = -1.4;
    mirrorGroup.traverse(m => {
      if (m.isMesh) {
        m.material = m.material.clone();
        m.material.transparent = true;
        m.material.opacity = Math.min((m.material.opacity || 1) * 0.22, 0.22);
        m.material.depthWrite = false;
      }
    });
    scene.add(mirrorGroup);

    /* ── 스크롤 연동 상태 ── */
    const state = {
      rotY: 0.22, rotX: -0.12,
      camZ: 5.5,  camY: 0.5,  camX: 0.0,
      lookY: 0.0,
      lidY: 0,    groupY: 0,
      flameIntensity: 2.5,
    };

    /* ── 스텝 정의 ── */
    const STEPS = [
      {
        rotY: 0.30,  rotX: -0.10,
        camZ: 7.8,   camY: 0.6,  camX: 0.0,
        lookY: 0.0,
        lidY: 0,     groupY: 0,
        light: 2.2,
        bg: 'radial-gradient(ellipse 80% 70% at 48% 52%, #1E1408 0%, #070603 100%)',
        ease: 'power2.out',
      },
      {
        rotY: -0.45, rotX: -0.30,
        camZ: 3.8,   camY: 2.6,  camX: -0.2,
        lookY: 2.9,
        lidY: 1.4,   groupY: 0,
        light: 1.8,
        bg: 'radial-gradient(ellipse 60% 55% at 35% 15%, #2C1E08 0%, #070603 100%)',
        ease: 'expo.out',
      },
      {
        rotY: 1.42,  rotX: 0.04,
        camZ: 3.2,   camY: 1.3,  camX: 0.4,
        lookY: 1.05,
        lidY: 3.4,   groupY: 0,
        light: 6.5,
        bg: 'radial-gradient(ellipse 55% 65% at 72% 28%, #381800 0%, #070603 100%)',
        ease: 'expo.out',
      },
      {
        rotY: -0.20, rotX: -0.45,
        camZ: 3.2,   camY: 1.0,  camX: 0.1,
        lookY: -0.1,
        lidY: 3.8,   groupY: 0,
        light: 3.0,
        bg: 'radial-gradient(ellipse 65% 50% at 45% 42%, #201600 0%, #070603 100%)',
        ease: 'power3.out',
      },
      {
        rotY: -1.05, rotX: 0.0,
        camZ: 4.0,   camY: 0.2, camX: 0.0,
        lookY: 0.0,
        lidY: 0,     groupY: 0,
        light: 1.6,
        bg: 'radial-gradient(ellipse 50% 75% at 60% 85%, #0A1828 0%, #070603 100%)',
        ease: 'power2.out',
      },
    ];

    /* ── 스텝 전환 함수 ── */
    const cards     = qsa('.detail-step-card');
    const indItems  = qsa('.indicator-item');
    const fillBar   = qs('#detailScrollFill');
    let curStep = -1;

    function goStep(idx) {
      if (idx === curStep) return;
      const prev = curStep; curStep = idx;
      const s = STEPS[idx];

      gsap.to(state, {
        rotY: s.rotY, rotX: s.rotX,
        camZ: s.camZ, camY: s.camY, camX: s.camX,
        lookY: s.lookY,
        lidY: s.lidY, groupY: s.groupY,
        flameIntensity: s.light,
        duration: 1.5, ease: s.ease || 'expo.out',
      });

      const bg = qs('#detailParallaxBg');
      if (bg) gsap.to(bg, { duration: 1.2, ease: 'power2.inOut',
        onStart() { bg.style.background = s.bg; }
      });

      if (prev >= 0) gsap.to(cards[prev], { opacity:0, y:-22, duration:0.35, ease:'power2.in', onComplete:()=>cards[prev].classList.remove('active') });
      gsap.fromTo(cards[idx], {opacity:0,y:24}, {opacity:1,y:0,duration:0.7,ease:'power3.out',delay:0.12, onStart:()=>cards[idx].classList.add('active')});

      indItems.forEach((el,i) => el.classList.toggle('active', i===idx));
    }

    /* ── 렌더 루프 ── */
    const clock = new THREE.Clock();
    function render() {
      requestAnimationFrame(render);
      const t = clock.getElapsedTime();

      const idleOff = Math.sin(t * 0.18) * 0.04;

      group.rotation.y   = state.rotY + idleOff;
      group.rotation.x   = state.rotX;
      group.position.y   = state.groupY;

      mirrorGroup.rotation.y = group.rotation.y;
      mirrorGroup.rotation.x = -state.rotX;
      mirrorGroup.position.y = state.groupY * 0.5 - 1.4;

      camera.position.set(state.camX, state.camY, state.camZ);
      camera.lookAt(0, state.lookY, 0);

      lidGroup.position.y = state.lidY;

      const f1 = Math.sin(t * 13.7) * 0.045;
      const f2 = Math.sin(t * 8.3  + 1.2) * 0.025;
      const f3 = Math.sin(t * 21.0) * 0.012;
      const flicker = f1 + f2 + f3;

      flameMesh.scale.x = 1 + flicker;
      flameMesh.scale.z = 1 + flicker * 0.7;
      flameMesh.scale.y = 1 - flicker * 0.4;
      coreMesh.scale.x  = 1 - flicker * 0.6;
      coreMesh.scale.y  = 1 + flicker * 0.5;
      glowMesh.scale.setScalar(1 + Math.abs(flicker) * 1.8);

      flameLight.intensity = state.flameIntensity
        + Math.sin(t * 11.3) * 0.5
        + Math.sin(t * 7.1 + 0.8) * 0.3;
      flameLight.position.x = Math.sin(t * 8.2) * 0.08;
      flameLight.position.z = Math.cos(t * 5.9) * 0.08;

      renderer.render(scene, camera);
    }
    render();

    /* ── 패럴랙스 배경 ── */
    const parallaxBg = qs('#detailParallaxBg');

    /* ── ScrollTrigger 핀고정 ── */
    const totalScroll = window.innerHeight * (STEPS.length + 0.8);

    ScrollTrigger.create({
      trigger: '#detail',
      start: 'top top',
      end: `+=${totalScroll}`,
      pin: '#detailScene',
      pinSpacing: true,
      onUpdate: self => {
        const p = self.progress;
        if (fillBar) fillBar.style.width = (p * 100) + '%';

        if (parallaxBg) {
          parallaxBg.style.transform = `translateY(${-p * 22}%)`;
        }

        const idx = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length));
        goStep(idx);
      }
    });

    /* ── 리사이즈 ── */
    window.addEventListener('resize', () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

  })(); // Three.js init

})();

/* ======================================
   5. 컬렉션 — 수평 스크롤
====================================== */
(function initCollection() {
  const track    = qs('#collectionTrack');
  const progress = qs('#progressBar');
  if (!track) return;

  const getTotal = () => track.scrollWidth - window.innerWidth;

  gsap.to(track, {
    x: () => -getTotal(),
    ease: 'none',
    scrollTrigger: {
      trigger: '#collectionWrap',
      start: 'top top',
      end: () => `+=${getTotal()}`,
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: self => {
        if (progress) progress.style.width = (self.progress * 100) + '%';
      }
    }
  });
})();

/* ======================================
   6. 재료 섹션 — 패럴랙스 + SVG 라인 드로잉
====================================== */
(function initMaterial() {

  // 자동 슬라이드쇼 — 3초마다 순환
  const slides = qsa('.parallax-slide');
  const dots   = qsa('.mat-dot');
  let current  = 0;
  let timer    = null;

  function switchSlide(idx) {
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    dots.forEach((d, i)   => d.classList.toggle('active', i === idx));
    current = idx;
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      switchSlide((current + 1) % slides.length);
    }, 3000);
  }

  function startSlideshow() { resetTimer(); }

  // 섹션 진입 시 슬라이드쇼 시작, 이탈 시 정지
  ScrollTrigger.create({
    trigger: '#material',
    start: 'top 80%',
    end: 'bottom top',
    onEnter:     () => startSlideshow(),
    onLeave:     () => clearInterval(timer),
    onEnterBack: () => startSlideshow(),
    onLeaveBack: () => clearInterval(timer),
  });

  // 드래그/스와이프 — 마우스 & 터치 공통
  const wrap = qs('#parallaxWrap');
  let dragStartX = 0;
  let isDragging = false;

  function onDragStart(x) {
    dragStartX = x;
    isDragging = true;
  }
  function onDragEnd(x) {
    if (!isDragging) return;
    isDragging = false;
    const diff = dragStartX - x;
    if (Math.abs(diff) < 30) return; // 30px 미만은 무시
    const next = diff > 0
      ? (current + 1) % slides.length              // 왼쪽 드래그 → 다음
      : (current - 1 + slides.length) % slides.length; // 오른쪽 드래그 → 이전
    switchSlide(next);
    resetTimer(); // 드래그 후 타이머 리셋
  }

  // 마우스
  wrap.addEventListener('mousedown',  e => onDragStart(e.clientX));
  wrap.addEventListener('mouseup',    e => onDragEnd(e.clientX));
  wrap.addEventListener('mouseleave', e => { if (isDragging) onDragEnd(e.clientX); });

  // 터치
  wrap.addEventListener('touchstart', e => onDragStart(e.touches[0].clientX), { passive: true });
  wrap.addEventListener('touchend',   e => onDragEnd(e.changedTouches[0].clientX));

  gsap.from('.material-title', {
    opacity: 0,
    y: 40,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.material-title',
      start: 'top 80%'
    }
  });

  const items = qsa('.material-item');
  items.forEach((item, i) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 65%',
      onEnter: () => {
        setTimeout(() => item.classList.add('visible'), i * 160);
        switchSlide(i);   // 재료 항목 진입 시 이미지 전환
      },
      onEnterBack: () => {
        switchSlide(i);   // 역방향 스크롤 시에도 전환
      }
    });
  });

  const drawPaths = qsa('.draw-path');
  drawPaths.forEach(path => {
    const len = path.getTotalLength ? path.getTotalLength() : 200;
    path.style.strokeDasharray  = len;
    path.style.strokeDashoffset = len;
  });

  gsap.to('.draw-path', {
    strokeDashoffset: 0,
    duration: 1.4,
    stagger: 0.15,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.material-items',
      start: 'top 75%'
    }
  });

  gsap.from('.parallax-badge', {
    opacity: 0,
    scale: 0.7,
    duration: 0.8,
    ease: 'back.out(1.5)',
    scrollTrigger: {
      trigger: '.parallax-badge',
      start: 'top 85%'
    }
  });
})();

/* ======================================
   7. 갤러리 — Stagger 등장
====================================== */
(function initGallery() {
  const items = qsa('.gallery-item');

  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.gallery-grid',
      start: 'top 75%'
    }
  });

  gsap.to('.gi-inner', {
    scale: 1,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.gallery-grid',
      start: 'top 75%'
    }
  });

  gsap.from('.gallery .section-title', {
    opacity: 0,
    y: 30,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.gallery',
      start: 'top 80%'
    }
  });
})();

/* ======================================
   8. Footer CTA 등장
====================================== */
(function initFooter() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.footer-cta',
      start: 'top 70%'
    }
  });

  tl.from('.footer-title', {
    opacity: 0,
    y: 50,
    duration: 1,
    ease: 'power3.out'
  });

  tl.from('.footer-actions', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: 'power3.out'
  }, '-=0.5');

  tl.from('.footer-bg-text', {
    opacity: 0,
    y: 40,
    duration: 1,
    ease: 'power2.out'
  }, '-=0.6');
})();

/* ======================================
   9. 섹션 전환 — 공통 reveal
====================================== */
qsa('.reveal-text').forEach(el => {
  gsap.from(el, {
    opacity: 0,
    y: 40,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 80%'
    }
  });
});

/* ======================================
   10. Hero 뚜껑 스크롤 오픈
====================================== */
gsap.to('#candleLid', {
  y: -60,
  ease: 'none',
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1.5
  }
});
