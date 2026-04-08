// All new product preview images — imported via @assets alias
import img_ss_anime_blue from "@assets/WhatsApp_Image_2026-04-07_at_8.47.39_PM_(2)_1775623940441.jpeg";
import img_ss_dark_red from "@assets/WhatsApp_Image_2026-04-07_at_8.47.39_PM_(1)_1775623940442.jpeg";
import img_ss_multipanel from "@assets/WhatsApp_Image_2026-04-07_at_8.47.39_PM_1775623940442.jpeg";
import img_ss_anime_fire from "@assets/WhatsApp_Image_2026-04-07_at_8.47.38_PM_1775623940444.jpeg";
import img_ss_demon from "@assets/WhatsApp_Image_2026-04-07_at_8.47.37_PM_(2)_1775623940444.jpeg";
import img_ss_anime_stand from "@assets/WhatsApp_Image_2026-04-07_at_8.47.37_PM_(1)_1775623940445.jpeg";
import img_ss_anime_comic from "@assets/WhatsApp_Image_2026-04-07_at_8.47.37_PM_1775623940452.jpeg";
import img_ss_fire_scene from "@assets/WhatsApp_Image_2026-04-07_at_8.47.35_PM_1775623940452.jpeg";
import img_ss_hooded from "@assets/WhatsApp_Image_2026-04-07_at_8.47.34_PM_(1)_1775623940453.jpeg";
import img_ss_dark_fire from "@assets/WhatsApp_Image_2026-04-07_at_8.47.34_PM_1775623940453.jpeg";
import img_ss_zombie from "@assets/WhatsApp_Image_2026-04-07_at_8.47.32_PM_(2)_1775623940453.jpeg";
import img_ss_demon_fire_a from "@assets/WhatsApp_Image_2026-04-07_at_8.47.32_PM_(1)_1775623940454.jpeg";
import img_ss_demon_fire_b from "@assets/WhatsApp_Image_2026-04-07_at_8.47.32_PM_1775623940454.jpeg";
import img_frame_neon from "@assets/WhatsApp_Image_2026-04-07_at_6.59.50_PM_(2)_1775623940455.jpeg";
import img_brb_dark_girl from "@assets/WhatsApp_Image_2026-04-07_at_10.46.48_AM_(1)_1775623940455.jpeg";
import img_brb_horror_man from "@assets/WhatsApp_Image_2026-04-07_at_10.46.44_AM_(1)_1775623940456.jpeg";
import img_brb_anime from "@assets/WhatsApp_Image_2026-04-07_at_10.46.43_AM_(1)_1775623940456.jpeg";
import img_brb_glowing from "@assets/WhatsApp_Image_2026-04-07_at_10.46.42_AM_(1)_1775623940456.jpeg";
import img_ending_demon from "@assets/WhatsApp_Image_2026-04-07_at_10.46.41_AM_(1)_1775623940457.jpeg";
import img_ending_silhouette from "@assets/WhatsApp_Image_2026-04-07_at_10.46.30_AM_(1)_1775623940457.jpeg";

// All images as a flat pool — used for product cards when no specific image is set
export const ALL_IMAGES = [
  img_ss_dark_red,
  img_ss_demon,
  img_ss_zombie,
  img_ss_hooded,
  img_ss_demon_fire_a,
  img_ending_demon,
  img_ss_anime_fire,
  img_ss_anime_stand,
  img_ss_anime_comic,
  img_ss_anime_blue,
  img_brb_anime,
  img_brb_dark_girl,
  img_ss_multipanel,
  img_ss_fire_scene,
  img_ss_dark_fire,
  img_ss_demon_fire_b,
  img_brb_horror_man,
  img_brb_glowing,
  img_ending_silhouette,
  img_frame_neon,
];

// Category-specific image sets
export const CATEGORY_IMAGES: Record<string, string[]> = {
  animated: [img_ss_anime_comic, img_ss_multipanel, img_ss_anime_stand, img_ss_fire_scene, img_ss_anime_blue],
  neon: [img_frame_neon, img_ss_dark_red, img_brb_glowing, img_ss_zombie, img_brb_horror_man],
  horror: [img_ss_demon, img_ss_hooded, img_ss_dark_fire, img_ss_zombie, img_ss_demon_fire_a, img_ending_demon, img_ss_demon_fire_b],
  anime: [img_ss_anime_fire, img_ss_anime_stand, img_ss_anime_comic, img_ss_anime_blue, img_brb_anime],
  vertical: [img_ss_multipanel, img_brb_dark_girl, img_ss_fire_scene, img_ss_anime_fire, img_ending_silhouette],
  interactive: [img_frame_neon, img_ss_dark_red, img_ss_multipanel, img_brb_glowing, img_ss_anime_comic],
  minimal: [img_brb_horror_man, img_ending_silhouette, img_ss_dark_red, img_brb_dark_girl, img_ss_anime_stand],
  grunge: [img_ss_hooded, img_brb_glowing, img_ss_zombie, img_ss_dark_fire, img_brb_horror_man],
  overlay: [img_frame_neon, img_ss_dark_red, img_ss_demon, img_ss_anime_fire, img_ss_multipanel],
  alert: [img_ss_demon_fire_a, img_ending_demon, img_brb_glowing, img_ss_zombie, img_ending_silhouette],
  bundle: [img_ss_demon_fire_b, img_ss_dark_fire, img_ss_fire_scene, img_brb_anime, img_ss_multipanel],
  pack: [img_brb_dark_girl, img_brb_horror_man, img_ss_anime_stand, img_ending_silhouette, img_brb_glowing],
  asset: [img_ss_anime_comic, img_frame_neon, img_ss_anime_blue, img_brb_anime, img_ss_multipanel],
  all: ALL_IMAGES,
};

export function getImageForProduct(productId: number, category?: string): string {
  const pool = category && CATEGORY_IMAGES[category] ? CATEGORY_IMAGES[category] : ALL_IMAGES;
  return pool[(productId - 1) % pool.length];
}

export function getCategoryHero(category: string): string {
  const imgs = CATEGORY_IMAGES[category] ?? ALL_IMAGES;
  return imgs[0];
}

// Category metadata for display
export const CATEGORY_META: Record<string, { icon: string; label: string; desc: string }> = {
  animated:    { icon: "🎬", label: "Animated Bundles",   desc: "Motion overlays & cinematic stingers" },
  neon:        { icon: "🌐", label: "Neon / Cyberpunk",   desc: "RGB glowing HUD & sci-fi frames" },
  horror:      { icon: "💀", label: "Horror / Jumpscare", desc: "Dark glitch effects & scary alerts" },
  anime:       { icon: "🌸", label: "Anime / VTuber",     desc: "Cute frames & manga style alerts" },
  vertical:    { icon: "📱", label: "Vertical / TikTok",  desc: "9:16 mobile streaming overlays" },
  interactive: { icon: "🎮", label: "Interactive",         desc: "Live chat popups & viewer goals" },
  minimal:     { icon: "✨", label: "Minimal / Clean",     desc: "Low distraction professional layouts" },
  grunge:      { icon: "📼", label: "Grunge / Retro VHS", desc: "Vintage textures & dust effects" },
  overlay:     { icon: "🖼️", label: "All Overlays",       desc: "Full-screen stream overlays" },
  alert:       { icon: "⚡", label: "All Alerts",          desc: "Follow & subscribe animations" },
  bundle:      { icon: "📦", label: "Full Bundles",        desc: "Complete streaming pack sets" },
  pack:        { icon: "🔊", label: "Sound Packs",         desc: "Audio effects & soundscapes" },
  asset:       { icon: "🗂️", label: "Digital Assets",     desc: "Logos, panels & graphics" },
};
