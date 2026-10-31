// Araçlar (özgün uygulamanın ToolInfo listesi: kimlik, simge, renk, ad, alt yazı). iPhone'da ışık ölçer yok: iOS ortam ışığı
// sensörünü uygulamalara açmaz (açık API yok), araç gösterilmez.
import { isIOS } from './native.js';

const ALL = [
  { id: 'level', icon: 'Level', accent: 'green', title: 'lb_tool_level', sub: 'lb_tool_level_sub', route: 'level' },
  { id: 'ar', icon: 'Box', accent: 'blue', title: 'lb_tool_ar', sub: 'lb_tool_ar_sub', route: 'ar' },
  { id: 'ruler', icon: 'Ruler', accent: 'orange', title: 'lb_tool_ruler', sub: 'lb_tool_ruler_sub', route: 'ruler?tab=ruler' },
  { id: 'protractor', icon: 'Protractor', accent: 'orange', title: 'lb_tool_protractor', sub: 'lb_tool_protractor_sub', route: 'ruler?tab=protractor' },
  { id: 'sound', icon: 'Activity', accent: 'yellow', title: 'lb_tool_sound', sub: 'lb_tool_sound_sub', route: 'sensors?tab=sound' },
  { id: 'light', icon: 'Sun', accent: 'yellow', title: 'lb_tool_light', sub: 'lb_tool_light_sub', route: 'sensors?tab=light' },
];
export const TOOLS = ALL.filter((x) => !(isIOS && x.id === 'light'));
export const toolById = (id) => TOOLS.find((x) => x.id === id);

/** Geçmiş kaydının aracından simge ve renk. */
export const HISTORY_TOOLS = {
  ar: { icon: 'Box', accent: 'blue' },
  ruler: { icon: 'Ruler', accent: 'orange' },
  protractor: { icon: 'Protractor', accent: 'orange' },
};
