const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={module:{exports:{}},console,require:()=>({Plugin:class{},ItemView:class{},PluginSettingTab:class{},Setting:class{},Notice:class{}})};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../main.js'),'utf8')+'\nmodule.exports={View:XHSCardStudioView,design:DETAIL_DESIGN,legacy:LEGACY_DETAIL_KEYS,clean:removeLegacyDetailConfig};',box);
const {View,design,legacy,clean}=box.module.exports,v=new View(null,{});
for(const size of [36,40]){
 const input={detail_font_size:size,detail_background_color:'#123456',detail_text_color:'#abcdef',detail_text_color_custom:true,detail_line_height:1.6};
 legacy.forEach(k=>input[k]=k.includes('color')?'#ff0000':'removed');
 v.config=v.normalizeConfig(input,'检查');
 legacy.forEach(k=>{assert.ok(!Object.hasOwn(v.config,k),k+' removed');assert.ok(!v.getFrontmatterSaveKeys().includes(k),k+' never saved');assert.ok(v.getManagedConfigKeys().includes(k),k+' cleaned when saving notes');});
 assert.equal(v.config.detail_background_color,'#123456');assert.equal(v.config.detail_text_color,'#abcdef');assert.equal(v.config.detail_line_height,1.55);
 const system=v.getDetailDesignSystem();assert.equal(system.margin,72);assert.equal(system.content,936);assert.equal(system.spacing.card,32);assert.equal(system.cardTokens.radius,24);
 const pairs=[[{type:'paragraph'},{type:'paragraph'},24],[{type:'heading',level:2},{type:'paragraph'},24],[{type:'heading',level:3},{type:'paragraph'},16],[{type:'paragraph'},{type:'heading',level:2},48]];
 for(const [before,after,expected]of pairs)assert.equal(v.getDetailBlankLineHeight(v.getDetailBlockGap(before,after)),expected);
 assert.equal(v.getDetailPalette({...v.config,detail_title_highlight_color:'#ff0000'}).accent,design.colors.accent);
}
const draft={detail_title_highlight_color:'#ff0000',detail_background_color:'#112233',detail_image_layouts:{image:{x:12,y:34,w:500,h:400}}};assert.equal(clean(draft),true);assert.equal(clean(draft),false);assert.equal(draft.detail_background_color,'#112233');assert.equal(draft.detail_image_layouts.image.x,12);
console.log('Legacy settings removed, valid colors/layout preserved, fixed gaps and unified line height passed');
