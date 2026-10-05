<template>
  <section
    ref="aboutSection"
    class="about-section"
    :class="{ 'is-visible': isVisible }"
    id="about"
    aria-labelledby="about-title"
  >
    <div class="about-inner">
      <div class="about-copy">
        <span class="section-kicker reveal-item">About Me</span>

        <div class="about-heading">
          <figure class="about-photo about-photo-mobile reveal-photo" aria-hidden="true">
            <div class="photo-frame">
              <img :src="portraitUrl" alt="" loading="lazy" />
            </div>
          </figure>

          <h2 id="about-title" class="reveal-item">Engineering systems that are ready to grow.</h2>
        </div>

        <div class="about-text">
          <p class="reveal-item">
            I'm a high school student passionate about computer science, with a growing interest in backend software engineering, distributed systems, machine learning, and system design.
          </p>
          <p class="reveal-item">
            I enjoy understanding how complex technologies work beneath the surface—not just how to use them, but how they are designed, optimized, and scaled. My current focus is on building practical software projects while strengthening my knowledge of algorithms, databases, software architecture, and modern engineering practices.
          </p>

          <p class="reveal-item">
            Beyond software development, I'm exploring machine learning and the broader field of computer science because my long-term goal is to contribute to technologies that push the industry forward. I aspire to work on challenging engineering problems, create innovative solutions, and help build the next generation of intelligent and scalable systems.
          </p>
          <p class="reveal-item">I'm committed to continuous learning, building meaningful projects, and developing the technical depth needed to make a lasting impact in technology.</p>
        </div>

        <div class="about-stack reveal-item" aria-label="Core stack">
          <span v-for="skill in skills" :key="skill.id">
            {{ skill.name }}
          </span>
        </div>

        <div class="about-notes reveal-item">
          <div>
            <strong>Beyond code</strong>
            <p>IELTS prep, SAT math, politics, self-development.</p>
          </div>
          <div>
            <strong>Writing</strong>
            <p>Sharing ideas through articles and content that go beyond implementation details.</p>
          </div>
        </div>
      </div>

      <figure class="about-photo about-photo-desktop reveal-photo">
        <div class="photo-frame">
          <img :src="portraitUrl" alt="Olimjon Makhmudov portrait" loading="lazy" />
        </div>
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import portraitUrl from '../assets/mkhdov.png';
import {supabase} from "../lib/supabase.ts";

const aboutSection = ref<HTMLElement | null>(null);
const isVisible = ref(false);
const skills = ref<any[]>([])
let observer: IntersectionObserver | null = null;

onMounted(async () => {
  const section = aboutSection.value;

  if (!section || !('IntersectionObserver' in window)) {
    isVisible.value = true;
    return;
  }

  const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('order_index')

  if (!error) skills.value = data ?? []

  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;

      isVisible.value = true;
      observer?.disconnect();
      observer = null;
    },
    {
      rootMargin: '0px 0px -18% 0px',
      threshold: 0.2,
    }
  );

  observer.observe(section);
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>

<style scoped>
.about-section {
  scroll-margin-top: 88px;
  background:
    linear-gradient(180deg, #ffffff 0%, #f8fafc 44%, #ffffff 100%);
  border-top: 1px solid rgba(108, 99, 255, 0.08);
  padding: 96px 40px 112px;
}

.about-inner {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
  gap: clamp(40px, 7vw, 92px);
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.about-copy {
  max-width: 690px;
}

.reveal-item,
.reveal-photo {
  opacity: 0;
  transform: translate3d(0, 28px, 0);
  transition:
    opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.reveal-photo {
  transform: translate3d(36px, 34px, 0) scale(0.97);
  transition-duration: 0.9s;
}

.about-section.is-visible .reveal-item,
.about-section.is-visible .reveal-photo {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

.about-section.is-visible .section-kicker {
  transition-delay: 0.04s;
}

.about-section.is-visible .about-photo {
  transition-delay: 0.24s;
}

.about-section.is-visible .about-heading h2 {
  transition-delay: 0.12s;
}

.about-section.is-visible .about-text p:nth-child(1) {
  transition-delay: 0.2s;
}

.about-section.is-visible .about-text p:nth-child(2) {
  transition-delay: 0.28s;
}

.about-section.is-visible .about-text p:nth-child(3) {
  transition-delay: 0.36s;
}

.about-section.is-visible .about-stack {
  transition-delay: 0.44s;
}

.about-section.is-visible .about-notes {
  transition-delay: 0.52s;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 700;
  color: #6c63ff;
  background: rgba(108, 99, 255, 0.08);
  border: 1px solid rgba(108, 99, 255, 0.18);
  padding: 6px 14px;
  border-radius: 999px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 18px;
}

.about-heading {
  margin-bottom: 24px;
}

.about-copy h2 {
  max-width: 650px;
  font-family: var(--heading);
  font-size: clamp(34px, 4vw, 54px);
  line-height: 1.05;
  letter-spacing: -1.2px;
  color: #1a1a2e;
}

.about-text {
  display: grid;
  gap: 18px;
}

.about-text p,
.about-notes p {
  font-family: var(--sans);
  font-size: clamp(15px, 1.35vw, 17px);
  line-height: 1.85;
  color: #64748b;
}

.about-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 30px;
}

.about-stack span {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 700;
  color: #312e81;
  background: #ffffff;
  border: 1px solid rgba(108, 99, 255, 0.18);
  border-radius: 10px;
  padding: 8px 14px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.55s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.2s ease;
}

.about-section.is-visible .about-stack span {
  opacity: 1;
  transform: translateY(0);
}

.about-section.is-visible .about-stack span:nth-child(1) {
  transition-delay: 0.5s;
}

.about-section.is-visible .about-stack span:nth-child(2) {
  transition-delay: 0.56s;
}

.about-section.is-visible .about-stack span:nth-child(3) {
  transition-delay: 0.62s;
}

.about-section.is-visible .about-stack span:nth-child(4) {
  transition-delay: 0.68s;
}

.about-notes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 34px;
}

.about-notes > div {
  border-left: 3px solid rgba(108, 99, 255, 0.55);
  padding-left: 18px;
}

.about-notes strong {
  display: block;
  font-family: var(--heading);
  font-size: 17px;
  line-height: 1.25;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.about-notes p {
  font-size: 14px;
  line-height: 1.7;
}

.about-photo {
  margin: 0;
}

.about-photo-mobile {
  display: none;
}

.about-photo-desktop {
  justify-self: end;
  width: min(100%, 430px);
}

.photo-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 24px;
  background: #ffffff;
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.16),
    0 3px 12px rgba(108, 99, 255, 0.12);
  transform: rotate(0deg);
  transition:
    transform 0.9s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

.about-section:not(.is-visible) .photo-frame {
  transform: rotate(-1.25deg);
  box-shadow:
    0 14px 42px rgba(15, 23, 42, 0.1),
    0 2px 8px rgba(108, 99, 255, 0.08);
}

.photo-frame::before {
  content: "";
  position: absolute;
  inset: 12px;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  pointer-events: none;
}

.photo-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 68%;
  transform: scale(1.24);
  transform-origin: center 68%;
  transition: transform 1.1s cubic-bezier(0.16, 1, 0.3, 1);
}

.about-section:not(.is-visible) .photo-frame img {
  transform: scale(1.32);
}

@media (max-width: 980px) {
  .about-section {
    padding: 82px 32px 96px;
  }

  .about-inner {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .about-copy {
    max-width: 760px;
  }

  .about-photo-desktop {
    justify-self: start;
    width: min(100%, 520px);
  }
}
@media (max-width: 640px) {
  .about-section {
    scroll-margin-top: 72px;
    padding: 68px 20px 76px;
  }

  .about-inner {
    max-width: 100%;
    display: block;
  }

  .section-kicker {
    font-size: 11px;
    margin-bottom: 16px;
  }

  /* Remove flex layout — heading goes full width, no photo beside it */
  .about-heading {
    display: block;
    margin-bottom: 22px;
  }

  .about-copy h2 {
    font-size: clamp(28px, 8.4vw, 38px);
    line-height: 1.1;
    letter-spacing: -0.8px;
  }

  /* Hide BOTH photo versions on mobile */
  .about-photo-mobile,
  .about-photo-desktop {
    display: none;
  }

  .about-text {
    gap: 16px;
  }

  .about-stack {
    margin-top: 24px;
  }

  .about-stack span {
    flex: 1 1 calc(50% - 10px);
    justify-content: center;
    min-width: 132px;
  }

  .about-notes {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-top: 28px;
  }
}


@media (max-width: 380px) {
  .about-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .about-stack span {
    flex-basis: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal-item,
  .reveal-photo,
  .about-stack span,
  .photo-frame,
  .photo-frame img {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .photo-frame img {
    transform: scale(1.24);
  }
}
</style>
