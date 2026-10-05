<template>
  <main class="home">
    <div class="hero-screen" :class="{ 'hero-intro-done': heroIntroDone }">
      <section class="hero-section">

        <div class="hero-photo" ref="photoContainer">
          <MyPhotoComponent :containerEl="photoContainer" />
        </div>

        <div class="hero-bridge" aria-hidden="true">
          <span class="bridge-line"></span>
          <span class="bridge-dot"></span>
        </div>

        <div class="hero-text">
          <div class="hero-text-inner" ref="textInner">
            <span class="hero-tag" ref="heroTag">👋 Hello there</span>

            <h1 class="hero-name">
              Hi
              <span class="accent-text">
                {{ typedName }}<span class="caret" aria-hidden="true">|</span>, Here
              </span>
            </h1>

            <p class="hero-sub">
              Software development is my passion. With
              <span class="highlight">5+ years</span> in this field, I'm still
              learning every single day — building things that matter.
            </p>

            <div class="hero-actions" ref="heroActions">
              <a
                  href="mailto:mkhdov@yahoo.com"
                  class="btn-primary"
                  id="say-hi-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Say Hi!
              </a>
              <router-link to="/blog" class="btn-secondary" id="blog-hero-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>
                </svg>
                Blog
              </router-link>
            </div>

            <div class="orb orb-1" aria-hidden="true"></div>
            <div class="orb orb-2" aria-hidden="true"></div>
          </div>
        </div>

      </section>

      <div class="scroll-indicator" aria-hidden="true">
        <div class="mouse">
          <div class="wheel"></div>
        </div>
      </div>
    </div>

    <AboutSection />
    <ProjectsSection />
    <ContactSection />
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AboutSection from '../components/AboutSection.vue';
import MyPhotoComponent from '../components/MyPhotoComponent.vue';
import ProjectsSection from '../components/ProjectsSection.vue';
import ContactSection from '../components/ContactSection.vue';

const photoContainer = ref<HTMLElement | null>(null);
const heroIntroDone = ref(sessionStorage.getItem('hero-intro-played') === '1');

const names = ["Olimjon", "Makhmudov", "mkhdov"];
const typedName = ref("");

onMounted(() => {
  sessionStorage.setItem('hero-intro-played', '1');
  let wordIndex = 0;
  let isDeleting = false;
  let currentText = "";

  const type = () => {
    const currentWord = names[wordIndex];
    let typeSpeed = 70;

    if (isDeleting) {
      currentText = currentWord.substring(0, currentText.length - 1);
      typeSpeed = 30;
    } else {
      currentText = currentWord.substring(0, currentText.length + 1);
    }

    typedName.value = currentText;

    if (!isDeleting && currentText === currentWord) {
      typeSpeed = 3000;
      isDeleting = true;
    } else if (isDeleting && currentText === "") {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % names.length;
      typeSpeed = 400;
    }

    setTimeout(type, typeSpeed);
  };

  setTimeout(type, 600);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

/* ─── Page wrapper ───────────────────────────── */
.home {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #ffffff;
  box-sizing: border-box;
  overflow: visible;
}

.hero-screen {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  padding-top: 64px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* ─── Two-column grid ────────────────────────── */
.hero-section {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Muted widths to give portrait narrow aspect ratio focus */
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  gap: 40px;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

/* ─── Photo column ───────────────────────────── */
.hero-photo {
  width: 100%;
  height: 750px;
  padding-bottom: 90px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  animation: fadeSlideIn 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
}

.hero-photo::before {
  content: '';
  position: absolute;
  top: 6%;
  left: 50%;
  transform: translateX(-50%);
  width: 72%;
  height: 52%;
  background: radial-gradient(ellipse at center, rgba(108, 99, 255, 0.07) 0%, transparent 72%);
  pointer-events: none;
  z-index: 0;
}

.hero-bridge {
  display: none;
}

/* Forces deep canvas child properties to occupy the container fully */
.hero-photo :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain;
}

/* ─── Text column ────────────────────────────── */
.hero-text {
  width: 100%;
  height: 560px; /* Matched perfectly to photo height for structural equality */
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
}

.hero-text-inner {
  position: relative;
  width: 100%;
  max-width: 520px;
}

/* ─── Tag ────────────────────────────────────── */
.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #6c63ff;
  background: rgba(108, 99, 255, 0.08);
  border: 1px solid rgba(108, 99, 255, 0.2);
  padding: 5px 14px;
  border-radius: 100px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 18px;
  animation: fadeSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* ─── Name ───────────────────────────────────── */
.hero-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(32px, 3.8vw, 52px);
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.15;
  letter-spacing: -1.5px;
  margin: 0 0 18px;
  animation: fadeSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
}

.accent-text {
  background: linear-gradient(135deg, #6c63ff 0%, #a78bfa 55%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block;
}

.caret {
  display: inline-block;
  font-weight: 300;
  background: none;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: #6c63ff;
  background-clip: unset;
  color: #6c63ff;
  margin: 0 1px;
  animation: caretBlink 1.1s step-start infinite;
}

.hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 20px;
  border-radius: 12px;
  border: 1.5px solid #6c63ff;
  background: #ffffff;
  color: #6c63ff;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 8px 22px rgba(108, 99, 255, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(108, 99, 255, 0.06);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(108, 99, 255, 0.18);
}

@keyframes caretBlink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* ─── Sub text ───────────────────────────────── */
.hero-sub {
  font-family: 'Inter', sans-serif;
  font-size: clamp(14px, 1.3vw, 17px);
  line-height: 1.75;
  color: #64748b;
  margin: 0 0 32px;
  animation: fadeSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
}

.highlight {
  color: #6c63ff;
  font-weight: 600;
}

/* ─── Actions ────────────────────────────────── */
.hero-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  animation: fadeSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.65s both;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #6c63ff 0%, #818cf8 100%);
  text-decoration: none;
  padding: 13px 26px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(108, 99, 255, 0.32);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  letter-spacing: 0.01em;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(108, 99, 255, 0.42);
}

.btn-primary:active { transform: translateY(0); }

/* ─── Decorative orbs ────────────────────────── */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(64px);
  pointer-events: none;
  z-index: -1;
}

.orb-1 {
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(108, 99, 255, 0.11) 0%, transparent 70%);
  top: -100px;
  right: -120px;
  animation: floatOrb 8s ease-in-out infinite;
}

.orb-2 {
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.09) 0%, transparent 70%);
  bottom: -80px;
  left: -90px;
  animation: floatOrb 10s ease-in-out infinite reverse;
}

/* ─── Animations ─────────────────────────────── */
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0);    }
}

@keyframes floatOrb {
  0%, 100% { transform: translate(0, 0)       scale(1);    }
  33%        { transform: translate(20px, -14px) scale(1.05); }
  66%        { transform: translate(-10px, 9px)  scale(0.97); }
}

.hero-intro-done .hero-photo,
.hero-intro-done .hero-tag,
.hero-intro-done .hero-name,
.hero-intro-done .hero-sub,
.hero-intro-done .hero-actions,
.hero-intro-done .scroll-indicator {
  animation: none;
  opacity: 1;
  transform: none;
}

/* ─── Tablet (641px – 900px) ─────────────────── */
@media (max-width: 900px) {
  .hero-screen {
    padding-top: 64px;
    align-items: flex-start;
    justify-content: flex-start;
    min-height: auto;
  }

  .hero-section {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    padding: 12px 32px 64px;
    gap: 0;
  }

  .hero-photo {
    height: clamp(280px, 38vh, 380px);
    padding-bottom: 0;
    margin: 0 auto -72px;
  }

  .hero-bridge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin: 0 auto 10px;
    position: relative;
    z-index: 1;
  }

  .hero-text {
    height: auto;
    justify-content: center;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .hero-text-inner {
    max-width: 560px;
    margin: 0 auto;
  }

  .hero-actions {
    justify-content: center;
  }

  .orb-2 { display: none; }
}

/* ─── Mobile (≤ 640px) ───────────────────────── */
@media (max-width: 640px) {
  .hero-screen {
    padding-top: 56px;
    align-items: flex-start;
    justify-content: flex-start;
    min-height: auto;
  }

  .hero-section {
    padding: 4px 20px 56px;
    gap: 0;
  }

  .hero-photo {
    width: min(88vw, 340px);
    height: clamp(380px, 58vh, 500px);
    padding-bottom: 0;
    margin: 0 auto -108px;
  }

  .hero-photo::before {
    top: 2%;
    width: 88%;
    height: 58%;
    background: radial-gradient(ellipse at center, rgba(108, 99, 255, 0.09) 0%, transparent 68%);
  }

  .hero-bridge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin: 0 auto 10px;
    position: relative;
    z-index: 1;
  }

  .bridge-line {
    width: 1px;
    height: 20px;
    background: linear-gradient(180deg, rgba(108, 99, 255, 0.42) 0%, rgba(108, 99, 255, 0.08) 100%);
    border-radius: 1px;
  }

  .bridge-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #6c63ff;
    opacity: 0.55;
    animation: bridgePulse 2.4s ease-in-out infinite;
  }

  .hero-text {
    position: relative;
    z-index: 1;
    padding-top: 0;
  }

  .hero-text-inner {
    max-width: 340px;
  }

  .hero-name {
    font-size: clamp(22px, 6.2vw, 28px);
    letter-spacing: -0.8px;
    margin-bottom: 10px;
  }

  .hero-tag {
    font-size: 10px;
    padding: 4px 12px;
    margin-bottom: 10px;
  }

  .hero-sub {
    font-size: clamp(12px, 3.2vw, 14px);
    line-height: 1.6;
    margin-bottom: 18px;
    max-width: 34ch;
    margin-left: auto;
    margin-right: auto;
  }

  .btn-primary {
    width: auto;
    font-size: 13px;
    padding: 10px 22px;
    border-radius: 12px;
  }

  .btn-primary svg {
    width: 15px;
    height: 15px;
  }

  .hero-actions {
    flex-direction: row;
    justify-content: center;
  }

  .orb-1 {
    display: block;
    width: 200px;
    height: 200px;
    top: 40px;
    right: -40px;
    opacity: 0.7;
  }
}

@keyframes bridgePulse {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50%       { opacity: 0.85; transform: scale(1.25); }
}

/* ─── Very small (≤ 380px) ───────────────────── */
@media (max-width: 380px) {
  .hero-section {
    padding: 2px 16px 48px;
  }

  .hero-photo {
    width: min(92vw, 320px);
    height: clamp(340px, 54vh, 440px);
    margin-bottom: -96px;
  }

  .hero-bridge {
    margin-bottom: 8px;
  }

  .bridge-line {
    height: 16px;
  }

  .hero-name {
    font-size: clamp(20px, 5.8vw, 24px);
  }

  .hero-sub {
    font-size: 12px;
    max-width: 32ch;
  }

  .btn-primary {
    font-size: 12.5px;
    padding: 9px 18px;
  }
}

/* ─── Scroll Indicator ───────────────────────── */
.scroll-indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  animation: fadeSlideIn 1s ease 1s forwards;
  z-index: 10;
}

@media (max-width: 640px) {
  .scroll-indicator {
    display: none;
  }
}

.mouse {
  width: 26px;
  height: 40px;
  border: 2px solid rgba(100, 116, 139, 0.5);
  border-radius: 13px;
  position: relative;
}

.wheel {
  width: 4px;
  height: 8px;
  background: #6c63ff;
  border-radius: 2px;
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  animation: scrollWheel 1.5s infinite;
}

@keyframes scrollWheel {
  0% { top: 6px; opacity: 1; height: 8px; }
  50% { top: 12px; opacity: 1; height: 12px; }
  100% { top: 20px; opacity: 0; height: 4px; }
}
</style>
