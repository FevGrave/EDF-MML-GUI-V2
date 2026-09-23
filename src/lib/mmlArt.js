// Character artwork served from the app's GitHub repo (images/ folder).
// jsDelivr CDN: cached, no rate limits, serves the raw JPEG bytes.
const BASE = "https://cdn.jsdelivr.net/gh/FevGrave/EDF-MML-GUI-V2@main/images/";

const FILES = [
  "AHH FINNALLY.jpg", "Android.jpg", "Android_N.jpg", "Bomber.jpg", "Bomber_N.jpg",
  "Cyclops.jpg", "Cyclops_N.jpg", "Debug.jpg", "Dragon.jpg", "Dragon_N.jpg",
  "Driller.jpg", "Driller_N.jpg", "hmm yes a star.jpg", "hmm yes a star_N.jpg",
  "Just a hobo.jpg", "Just a hobo_N.jpg", "Large Android.jpg", "Large Android_N.jpg",
  "Night.jpg", "NightOnFire.jpg", "Preemo.jpg", "Preemo_N.jpg",
  "Red Bomber.jpg", "Red Bomber_N.jpg", "sky snake.jpg", "sky snake_N.jpg",
  "Sky.jpg", "There is no escape.jpg", "There is no escape_N.jpg",
  "This guy thinks your sus.jpg", "This guy thinks your sus_N.jpg",
  "Yoink.jpg", "Yoink_N.jpg",
];

export const ART = FILES.map((f) => ({
  name: f.replace(/\.jpg$/i, "").replace(/_N$/i, " (N)"),
  url: BASE + encodeURIComponent(f),
}));