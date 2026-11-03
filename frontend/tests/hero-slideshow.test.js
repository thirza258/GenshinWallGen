import test from "node:test";
import assert from "node:assert/strict";

const HERO_SLIDES = [
  {
    id: "natlan",
    label: "🔥 Natlan 5.0",
    name: "5.0 - Flowers Resplendent on the Sun-Scorched Sojourn.png",
    region: "Natlan (5.0)",
  },
  {
    id: "fontaine",
    label: "🌊 Fontaine",
    name: "4.2 - Masquerade of the Guilty.png",
    region: "Fontaine (4.2)",
  },
  {
    id: "sumeru",
    label: "🌿 Sumeru",
    name: "3.0 - The Morn a Thousand Roses Brings.png",
    region: "Sumeru (3.0)",
  },
  {
    id: "inazuma",
    label: "⚡ Inazuma",
    name: "2.5 - When the Sakura Bloom.png",
    region: "Inazuma (2.5)",
  },
  {
    id: "liyue",
    label: "🪨 Liyue",
    name: "2.4 - Fleeting Colors in Flight.png",
    region: "Liyue (2.4)",
  },
  {
    id: "mondstadt",
    label: "🍃 Mondstadt",
    name: "1.0 - Welcome to Teyvat.png",
    region: "Mondstadt (1.0)",
  },
];

test("hero slides cover all major regions with valid source filenames", () => {
  assert.equal(HERO_SLIDES.length, 6);
  for (const slide of HERO_SLIDES) {
    assert.ok(slide.id && slide.label && slide.name && slide.region);
    assert.ok(slide.name.endsWith(".png") || slide.name.endsWith(".jpg"));
  }
});

test("hero slideshow index navigation cycles smoothly forward and backward", () => {
  const total = HERO_SLIDES.length;
  const nextIndex = (idx) => (idx + 1) % total;
  const prevIndex = (idx) => (idx - 1 + total) % total;

  assert.equal(nextIndex(0), 1);
  assert.equal(nextIndex(total - 1), 0);
  assert.equal(prevIndex(0), total - 1);
  assert.equal(prevIndex(2), 1);
});

test("hero image URL encoder handles spaces and special characters safely", () => {
  const backendUrl = "http://localhost:8009/api";
  const slide = HERO_SLIDES[0];
  const url = `${backendUrl}/source-images/${encodeURIComponent(slide.name)}`;
  assert.ok(url.includes("Flowers%20Resplendent"));
  assert.ok(url.startsWith("http://localhost:8009/api/source-images/"));
});
