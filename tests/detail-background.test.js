const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sandbox={module:{exports:{}},console,require:()=>({Plugin:class{},ItemView:class{},PluginSettingTab:class{},Setting:class{},Notice:class{}})};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../main.js'),'utf8')+'\nmodule.exports={View:XHSCardStudioView,defaults:DEFAULT_CONFIG};',sandbox);
const {View,defaults}=sandbox.module.exports,view=new View(null,{});
assert.equal(defaults.detail_background_color,'#f5f5f7');
for(const style of ['neon-grid','composition','huawei-product','clean-gradient']) {
  view.config={...defaults,xhs_style:style,detail_background_color:'#112233'};
  view.normalizeDetailDesignConfig();assert.equal(view.config.detail_background_color,'#112233');
  assert.equal(view.getDetailDesignSystem().colors.background,'#112233');
  assert.equal(view.getDetailDesignSystem().colors.card,'#243443');
  assert.equal(view.getDetailDesignSystem().colors.titleBand,'#243443');
  const ctx={fillRect(x,y,w,h){assert.equal(this.fillStyle,'#112233');assert.equal(w,1080);assert.equal(h,1440);}};
  view.drawStyledDetailBackground(ctx,1080,1440);
}
console.log('Custom page backgrounds and adaptive card surfaces passed');

for(const color of ['#abc', '#F7FBFF', '', 'invalid']) {
  view.config={...defaults,detail_background_color:color};
  view.normalizeDetailDesignConfig();
  assert.equal(view.config.detail_background_color, view.parseCoverHexColor(color) || defaults.detail_background_color);
}
view.config=view.normalizeConfig({...defaults,detail_background_color:'#eaf6ff'},'Background');
assert.equal(view.config.detail_background_color,'#eaf6ff');
const restored=view.normalizeConfig(JSON.parse(JSON.stringify(view.serializeConfig())),'Background');
assert.equal(restored.detail_background_color,'#eaf6ff');
view.applyCompositionTheme(restored);
assert.equal(restored.detail_background_color,'#eaf6ff');

for (const background of ['#000000','#112233','#ffffff','#f7fbff']) {
  view.config={...defaults,detail_background_color:background};
  view.normalizeDetailDesignConfig();
  const palette=view.getDetailPalette();
  for (const surface of [palette.background,palette.card,palette.media]) {
    assert.ok(view.getDetailColorContrast(palette.ink,surface)>=4.5);
    assert.ok(view.getDetailColorContrast(palette.bodyInk,surface)>=4.5);
  }
}
view.config={...defaults,detail_background_color:'#000000',detail_text_color:'#fff0cc',detail_text_color_custom:true};
view.normalizeDetailDesignConfig();
assert.equal(view.getDetailPalette().bodyInk,'#fff0cc');
const custom=view.normalizeConfig(JSON.parse(JSON.stringify(view.serializeConfig())),'Colors');
assert.equal(custom.detail_text_color,'#fff0cc');
assert.equal(view.getDetailPalette(custom).ink,'#fff0cc');

view.config={...defaults,detail_background_color:'#ff8800',detail_text_color:'#9afe20',detail_text_color_custom:true};
view.normalizeDetailDesignConfig();
assert.equal(view.getDetailPalette().ink,'#9afe20');
assert.equal(view.getDetailPalette().bodyInk,'#9afe20');
const saved=view.normalizeConfig(JSON.parse(JSON.stringify(view.serializeConfig())),'Manual color');
assert.equal(saved.detail_text_color_custom,true);
assert.equal(view.getDetailPalette(saved).ink,'#9afe20');
saved.detail_text_color='#1d1d1f';saved.detail_background_color='#000000';
assert.equal(view.getDetailPalette(saved).ink,'#1d1d1f');
saved.detail_text_color_custom=false;
assert.equal(view.getDetailPalette(saved).ink,'#f5f5f7');
