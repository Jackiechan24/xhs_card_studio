const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sandbox={module:{exports:{}},console,require:()=>({Plugin:class{},ItemView:class{},PluginSettingTab:class{},Setting:class{},Notice:class{}})};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../main.js'),'utf8')+'\nmodule.exports={View:XHSCardStudioView,defaults:DEFAULT_CONFIG};',sandbox);
const {View,defaults}=sandbox.module.exports,v=new View(null,{});
assert.equal(defaults.cover_font_family,'sf-pro');assert.equal(defaults.detail_font_family,'sf-pro');
v.config=v.normalizeConfig({cover_font_family:'yahei-ui',detail_font_family:'sf-pro'},'字体检查');
assert.equal(v.getCanvasFontFamilyForModule({}),'"SF Pro"');assert.equal(v.getDetailCanvasFontFamily(),'"SF Pro"');
for(const key of ['cover_font_family','detail_font_family']){assert.ok(v.getFrontmatterSaveKeys().includes(key));assert.ok(v.getManagedConfigKeys().includes(key));}
const saved=v.serializeConfig(),restored=v.normalizeConfig(JSON.parse(JSON.stringify(saved)),'恢复');assert.equal(restored.cover_font_family,'sf-pro');assert.equal(restored.detail_font_family,'sf-pro');
const before=v.getDetailPaginationKey();v.config.detail_font_family='yahei-ui';assert.notEqual(v.getDetailPaginationKey(),before);assert.equal(v.getDetailDesignSystem().typography.textFont,'"SF Pro"');
assert.equal(v.normalizeConfig({cover_font_family:'invalid',detail_font_family:'invalid'},'检查').cover_font_family,'sf-pro');
console.log('Legacy font choices normalize to fixed SF Pro for cover, detail and export');
