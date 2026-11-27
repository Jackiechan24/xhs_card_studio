const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={module:{exports:{}},console,require:()=>({Plugin:class{},ItemView:class{},PluginSettingTab:class{},Setting:class{},Notice:class{}})};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../main.js'),'utf8')+'\nmodule.exports={View:XHSCardStudioView,defaults:DEFAULT_CONFIG};',box);
const {View,defaults}=box.module.exports,v=new View(null,{});
const fresh=c=>{const config=v.normalizeConfig({...defaults,xhs_style:c.style,composition_variant:c.id,title:'一篇笔记，变成一组图文',subtitle:'让内容排版更轻松',composition_description:'选择模板、替换图片和文案，完成封面与正文排版。'},'检查');v.config=config;v.ensureUnifiedCoverVisuals();return config;};
const bounds=m=>[m.x,m.y,m.w,m.h];
for(const c of v.getUnifiedCoverTemplates()){
 const config=fresh(c),roles=config.xhs_modules.filter(m=>m.coverTextRole),images=config.xhs_modules.filter(m=>m.type==='image'&&!m.custom);
 for(const m of roles){assert.ok(m.x>=72&&m.x+m.w<=1008,c.id+' horizontal bounds');assert.ok(m.y>=72&&m.y+m.h<=1368,c.id+' vertical bounds');}
 if(['aside-image','left-image-title'].includes(c.id)){
  const title=roles.find(m=>m.coverTextRole==='title'),image=images[0];
  assert.equal(title.x,c.id==='aside-image'?72:180);assert.equal(image.x,c.id==='aside-image'?480:0);assert.equal(title.w,c.id==='aside-image'?936:828);assert.equal(image.w,c.id==='aside-image'?528:600);assert.equal(image.w/image.h,3/4);assert.equal(image.objectFit,'contain');assert.equal(image.borderRadius,24);
 }
 if(c.id==='band-columns'){assert.equal(images[0].w,936);assert.equal(images[0].h,702);assert.equal(images[0].objectFit,'contain');}
 if(c.id==='headline-band'){assert.equal(images[0].x,(1080-images[0].w)/2);assert.ok(images[0].w<=1080);assert.equal(images[0].w/images[0].h,4/3);}
 const geometry=()=>JSON.stringify(config.xhs_modules.map(m=>[m.id,...bounds(m)]));const before=geometry();v.layoutCoverText();assert.equal(geometry(),before,c.id+' reflow drift');
 const selected=images[0]||roles[0];selected.x+=8;selected.y+=8;selected.manualPosition=true;
 const others=config.xhs_modules.filter(m=>m!==selected&&(m.type==='image'||m.coverTextRole)).map(m=>[m.id,...bounds(m)]);
 v.layoutCoverText();assert.deepEqual(config.xhs_modules.filter(m=>m!==selected&&(m.type==='image'||m.coverTextRole)).map(m=>[m.id,...bounds(m)]),others,c.id+' drag moved a neighbour');
 const saved=v.normalizeConfig(JSON.parse(JSON.stringify(config)),'检查');v.layoutCoverText(saved);assert.ok(bounds(saved.xhs_modules.find(m=>m.id===selected.id)).every((n,i)=>Math.abs(n-bounds(selected)[i])<1),c.id+' manual position lost after reopen');
}
console.log('Ten cover layouts: safe bounds, image fit, stable reflow and independent manual positioning passed');
