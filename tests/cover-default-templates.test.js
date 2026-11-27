const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={module:{exports:{}},console,require:()=>({Plugin:class{},ItemView:class{},PluginSettingTab:class{},Setting:class{},Notice:class{}})};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../main.js'),'utf8')+'\nmodule.exports={View:XHSCardStudioView};',box);
const v=new box.module.exports.View(null,{});v.render=async()=>{};v.persistDraft=()=>{};
const expected={'headline-band':[4/3],'image-caption':[4/3],'band-columns':[4/3],mosaic:[16/9,16/9,16/9],'aside-image':[3/4],'left-image-title':[3/4],'solid-poster':[3/4],'center-banner':[1],'neon-grid':[],'nng-red-system':[1.5,1.5]};
const snapshot=()=>JSON.stringify(v.config.xhs_modules.map(m=>({id:m.id,x:m.x,y:m.y,w:m.w,h:m.h,...(m.type==='text'?{fontSize:m.fontSize,textAlign:m.textAlign}:{}),...(m.type==='image'?{objectFit:m.objectFit,aspectRatio:m.aspectRatio}: {})})));
for(const choice of v.getUnifiedCoverTemplates()){
 v.config=v.normalizeConfig({xhs_style:choice.style,composition_variant:choice.id,title:'一篇笔记，变成一组图文',subtitle:'让内容排版更轻松',composition_description:'选择模板、替换图片和文案，完成封面与正文排版。'},'检查');v.ensureUnifiedCoverVisuals();
 const images=v.config.xhs_modules.filter(m=>m.type==='image'&&!m.custom);
 assert.equal(images.length,expected[choice.id].length,choice.id+' image count');
 images.forEach((m,i)=>assert.ok(Math.abs(m.w/m.h-expected[choice.id][i])<0.0001,choice.id+' default ratio'));
 const before=snapshot();v.config=v.normalizeConfig(JSON.parse(JSON.stringify(v.config)),'检查');v.ensureUnifiedCoverVisuals();assert.equal(snapshot(),before,choice.id+' reopen');
 const title=v.config.xhs_modules.find(m=>m.coverTextRole==='title');Object.assign(title,{x:100,y:100,w:700,manualPosition:true,manualSize:true});
 v.resetCurrentCoverTemplate();assert.equal(snapshot(),before,choice.id+' reset restores default geometry and image fit');
}
console.log('All ten default template ratios, reopening and reset parity passed');
