import heroLivingImg from '../assets/images/hero_luxury_living_room_1794552439172.jpg';
import flutedPanelsImg from '../assets/images/cat_fluted_panels_1794552439261.jpg';
import uvSheetsImg from '../assets/images/cat_uv_sheets_1794552440056.jpg';
import uvMarbleImg from '../assets/images/cat_uv_marble_sheets_1794552441038.jpg';
import charcoalPanelsImg from '../assets/images/cat_charcoal_panels_1794552441642.jpg';
import decorativePanelsImg from '../assets/images/cat_decorative_wall_panels_1794552442030.jpg';
import otherMaterialsImg from '../assets/images/cat_other_materials_1794552442567.jpg';
import aboutShowroomImg from '../assets/images/about_showroom_craft_1794552442731.jpg';

const STATIC_ASSET_MAP: Record<string, string> = {
  '/src/assets/images/hero_luxury_living_room_1794552439172.jpg': heroLivingImg,
  '/src/assets/images/cat_fluted_panels_1794552439261.jpg': flutedPanelsImg,
  '/src/assets/images/cat_uv_sheets_1794552440056.jpg': uvSheetsImg,
  '/src/assets/images/cat_uv_marble_sheets_1794552441038.jpg': uvMarbleImg,
  '/src/assets/images/cat_charcoal_panels_1794552441642.jpg': charcoalPanelsImg,
  '/src/assets/images/cat_decorative_wall_panels_1794552442030.jpg': decorativePanelsImg,
  '/src/assets/images/cat_other_materials_1794552442567.jpg': otherMaterialsImg,
  '/src/assets/images/about_showroom_craft_1794552442731.jpg': aboutShowroomImg,
};

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return heroLivingImg;
  return STATIC_ASSET_MAP[url] ?? url;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.readAsDataURL(file);
  });
}
