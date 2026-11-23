const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const sandbox={module:{exports:{}},console,require:()=>({Plugin:class{},ItemView:class{},PluginSettingTab:class{},Setting:class{},Notice:class{}})};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../main.js'),'utf8')+';module.exports=XHSCardStudioView;',sandbox);
for(const role of ['title','subtitle','description','image']) {
  const v=new sandbox.module.exports(null,{});v.config=v.normalizeConfig({xhs_style:'composition',composition_variant:'headline-band',title:'AI工具用得越多，\n为什么你反而更忙？',subtitle:'职场 AI 技能提升指南',composition_description:'不要问这个工作能不能交给AI，而要问这个工作里的哪些环节适合AI。'},'Test');v.ensureUnifiedCoverVisuals();
  const modules=v.config.xhs_modules,desc=modules.find(m=>m.coverTextRole==='description');
  assert.equal(desc.fontSize,28);assert.equal(desc.lineHeight,1.5);
  const selected=modules.find(m=>role==='image'?m.type==='image':m.coverTextRole===role),others=modules.filter(m=>m!==selected && (m.coverTextRole||m.type==='image'));
  const snapshot=JSON.stringify(others.map(m=>[m.id,m.x,m.y,m.w,m.h,m.fontSize]));
  selected.y=Math.round(selected.y+8);v.markModuleManualChange(selected,{y:selected.y});
  for(let i=0;i<4;i++)v.layoutCoverText();
  assert.equal(JSON.stringify(others.map(m=>[m.id,m.x,m.y,m.w,m.h,m.fontSize])),snapshot,role+' drag rearranged another module');
  assert.equal(desc.fontSize,28);
  const savedY=selected.y;
  v.config=v.normalizeConfig(JSON.parse(JSON.stringify(v.serializeConfig())),'Saved');
  assert.equal(v.config.xhs_modules.find(m=>m.id===selected.id).y,savedY);
  assert.equal(v.config.xhs_modules.find(m=>m.coverTextRole==='description').fontSize,28);
  const restored=v.config.xhs_modules.find(m=>m.coverTextRole==='description');restored.coverTextStyle={fontSize:26,lineHeight:1.4};v.layoutCoverText();
  assert.equal(restored.fontSize,26);assert.equal(restored.lineHeight,1.4);
}
console.log('Headline manual positions, unchanged neighbours, stable caption type and restored custom type passed');
