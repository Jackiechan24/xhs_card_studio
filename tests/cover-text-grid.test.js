const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sandbox={module:{exports:{}},console,require:()=>({Plugin:class{},ItemView:class{},PluginSettingTab:class{},Setting:class{},Notice:class{}})};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../main.js'),'utf8')+'\nmodule.exports={View:XHSCardStudioView,defaults:DEFAULT_CONFIG};',sandbox);
const {View,defaults}=sandbox.module.exports,view=new View(null,{});
for(const choice of view.getUnifiedCoverTemplates()) {
  const config={...defaults,xhs_style:choice.style,cover_layout_preset:choice.style==='nng-red-system'?choice.style:'none',composition_variant:choice.id,title:'标题一\n标题二\n标题三',subtitle:'副标题',composition_description:'辅助文案',cover_editor_version:1};
  view.config=config;config.xhs_modules=view.createDefaultModulesForStyle(choice.style,config);
  const images=()=>JSON.stringify(config.xhs_modules.filter(m=>m.type==='image').map(({id,x,y,w,h,src})=>({id,x:choice.id==='headline-band'?undefined:x,y:['headline-band','image-caption','left-image-title'].includes(choice.id)?undefined:y,w:choice.id==='headline-band'?undefined:w,h:['headline-band','image-caption','left-image-title'].includes(choice.id)?undefined:h,src})));
  if (choice.id === "mosaic") {
    assert.equal(config.xhs_modules.filter(m => m.type === "image").length, 3);
    config.xhs_modules.push({id:"composition-image-4",type:"image",src:"legacy.png"},{id:"composition-image-5",type:"image",src:""});
  }
  let before=images();view.ensureUnifiedCoverVisuals(config);
  // New default frames follow the cover layout standard; subsequent edits must be stable.
  if(choice.id!=="mosaic")before=images();
  if(choice.id==='mosaic') {
    const tiles=config.xhs_modules.filter(m=>m.type==='image');
    assert.equal(tiles.length,3);
    const mainHeight=936*9/16,secondaryHeight=456*9/16;
    const frames=[[72,72,936,mainHeight],[72,96+mainHeight,456,secondaryHeight],[552,96+mainHeight,456,secondaryHeight]];
    tiles.forEach((m,i)=>assert.deepEqual([m.x,m.y,m.w,m.h],frames[i]));
    assert.deepEqual(Array.from(config.mosaic_image_archive, m => m.src), ["legacy.png"]);
    assert.equal(tiles[2].x-tiles[1].x-tiles[1].w,24);
    assert.ok(Math.abs(tiles[1].y-tiles[0].y-tiles[0].h-24)<0.001);
    assert.equal(tiles[0].x+tiles[0].w,1008);
    assert.equal(tiles[2].x+tiles[2].w,1008);
    assert.ok(Math.abs(tiles[0].w/tiles[0].h-16/9)<0.001);
    assert.ok(Math.abs(tiles[1].w/tiles[1].h-16/9)<0.001);
    tiles.forEach(m=>{assert.equal(view.getImageFrameRatio(m),'16:9');assert.equal(m.objectFit,'contain');});
    before=images();
  }
  const roles=config.xhs_modules.filter(m=>m.coverTextRole);
  assert.equal(roles.length,3,choice.id+' three core roles');
  if(choice.id==='nng-red-system') {
    assert.equal(images(),before,'Comparison image frames are fixed');
    for(const m of roles){assert.equal(m.textAlign,'center');assert.equal(m.letterSpacing,0);}
    const band=config.xhs_modules.find(m=>m.id==='comparison-backdrop');
    assert.ok(band.y<720&&band.y+band.h>720,'Title band straddles the image seam');
    assert.equal(band.background,'rgba(255, 255, 255, 0.7)');
    assert.equal(config.xhs_modules.filter(m=>m.type==='image').length,2);
    continue;
  }
  if(choice.id==='neon-grid') {
    assert.equal(config.background_color,'#000000');assert.equal(config.cover_title_color,'#ffffff');
    assert.equal(config.accent_color,'#00d6bd');
    const footer=config.xhs_modules.find(m=>m.id==='footer');
    assert.equal(footer.text,'赵同学AI');assert.equal(footer.fontSize,44);assert.equal(footer.locked,true);
    config.accent_color='#56a8ff';footer.y=600;footer.manualLayout=true;
    view.layoutCoverText(config);
    assert.equal(config.background_color,'#000000');assert.equal(footer.y,1350);
    for(const id of ['footer','magazine-subtitle-panel'])assert.equal(config.xhs_modules.find(m=>m.id===id).background,'#56a8ff');
    const panel=config.xhs_modules.find(m=>m.id==='magazine-subtitle-panel');
    const sub=config.xhs_modules.find(m=>m.id==='subtitle');
    assert.equal(sub.x,72);assert.equal(panel.w,sub.w);assert.equal(panel.h,sub.h);
    assert.equal(panel.y,sub.y);assert.equal(panel.x,sub.x);
    const bounds = ({x, y, w, h}) => [x, y, w, h];
    const initialWidth = panel.w;
    Object.assign(sub, {x:200, y:900, manualPosition:true});
    view.layoutCoverText(config);
    assert.equal(sub.x,200);
    assert.equal(sub.y,900);
    assert.deepEqual(bounds(panel),bounds(sub),'Background follows the dragged subtitle');

    Object.assign(panel, {x:-100, w:1800, manualPosition:true, manualSize:true});
    config.subtitle += '，随文案自动伸展';
    view.layoutCoverText(config);
    assert.equal(sub.x,200);
    assert.equal(sub.y,900);
    assert.ok(panel.w>initialWidth,'Background grows with subtitle text');
    assert.deepEqual(bounds(panel),bounds(sub),'Background uses the subtitle bounds after reflow');

    const saved = view.normalizeConfig(JSON.parse(JSON.stringify(config)),'Fallback');
    view.layoutCoverText(saved);
    const restoredSub = saved.xhs_modules.find(m=>m.id==='subtitle');
    const restoredPanel = saved.xhs_modules.find(m=>m.id==='magazine-subtitle-panel');
    assert.deepEqual(bounds(restoredSub),bounds(sub),'Subtitle position survives reopening');
    assert.deepEqual(bounds(restoredPanel),bounds(restoredSub),'Background stays attached after reopening');
    const mark=config.xhs_modules.find(m=>m.id==='checkers');assert.equal(mark.w,200);assert.equal(mark.x+mark.w,1008);
    assert.ok(config.xhs_modules.some(m=>m.id==='magazine-subtitle-panel'));
    assert.equal(config.xhs_modules.find(m=>m.id==='footer').y,1350);
    for(const id of ['arrow','tags','cta','small-title','magazine-cta-panel'])assert.ok(!config.xhs_modules.some(m=>m.id===id));
  }
  assert.equal(images(),before,choice.id+' image rectangles unchanged');
  for(const m of roles) {
    assert.equal(m.textAlign,'left');assert.equal(m.letterSpacing,0);
    assert.equal(m.fontWeight,{title:600,subtitle:600,description:400}[m.coverTextRole]);
    assert.ok(m.fontSize>={title:choice.id==='neon-grid'?132:['mosaic','band-columns'].includes(choice.id)?64:['aside-image','left-image-title'].includes(choice.id)?64:choice.id==='headline-band'?80:100,subtitle:choice.id==='headline-band'?32:40,description:choice.id==='headline-band'?24:36}[m.coverTextRole]);
    assert.ok(m.x>=72 && m.x+m.w<=1008 && m.y>=72 && m.y+m.h<=1368,choice.id+' safe text bounds');
  }
  assert.equal(roles.find(m=>m.coverTextRole==='title').x,choice.id==='left-image-title'?180:72);
  const rule=config.xhs_modules.find(m=>m.id==='cover-structure-rule');
  assert.ok(rule && rule.h===1);assert.equal(rule.background,config.secondary_color);assert.ok(view.isLineModule(rule));
  Object.assign(rule,{x:160,y:600,w:500,h:3,manualPosition:true,manualSize:true});
  view.layoutCoverText(config);
  assert.deepEqual([rule.x,rule.y,rule.w,rule.h],[160,600,500,1]);
  Object.assign(rule,{manualPosition:false,manualSize:false});view.layoutCoverText(config);
  if(['center-banner','solid-poster'].includes(choice.id)) {
    const backdrop=config.xhs_modules.find(m=>m.id==='composition-block');
    assert.equal(backdrop.background,'rgba(255, 255, 255, 0.7)');
    config.background_color='#000000';config.cover_title_color='#ffffff';
    view.layoutCoverText(config);
    assert.equal(backdrop.background,'rgba(255, 255, 255, 0.7)','Mask does not follow theme');
    assert.equal(roles.find(m=>m.coverTextRole==='title').color,'#ffffff','Explicit title color must not be silently replaced');
  }
  config.title='新的标题';view.syncUnifiedCoverContent();
  assert.equal(images(),before,choice.id+' copy changes do not resize images');
  const normalized=view.normalizeConfig(JSON.parse(JSON.stringify(config)),'Fallback');
  assert.equal(normalized.cover_text_layout_version,1);
  if(choice.id==='mosaic')assert.deepEqual(Array.from(normalized.mosaic_image_archive, m => m.src), ["legacy.png"]);
  assert.equal(JSON.stringify(normalized.xhs_modules.filter(m=>m.type==='image').map(({id,x,y,w,h,src})=>({id,x:choice.id==='headline-band'?undefined:x,y:['headline-band','image-caption','left-image-title'].includes(choice.id)?undefined:y,w:choice.id==='headline-band'?undefined:w,h:['headline-band','image-caption','left-image-title'].includes(choice.id)?undefined:h,src}))),before);
  for(const module of roles) {
    const patch={fontSize:module.fontSize+4,fontWeight:500,lineHeight:1.5,letterSpacing:2,textAlign:'right'};
    Object.assign(module,patch);view.markModuleManualChange(module,patch);
    view.syncUnifiedCoverContent();
    for(const [key,value] of Object.entries(patch))assert.equal(module[key],value,choice.id+' manual '+key);
    const saved=view.normalizeConfig(JSON.parse(JSON.stringify(config)),'Fallback');
    view.layoutCoverText(saved);
    const restored=saved.xhs_modules.find(item=>item.id===module.id);
    for(const [key,value] of Object.entries(patch))assert.equal(restored[key],value,choice.id+' restored '+key);
  }
}
console.log('Ten cover text grids, typography and unchanged images passed');
{
  const config={...defaults,xhs_style:'composition',composition_variant:'mosaic',title:'标题',subtitle:'副标题',composition_description:'文案',cover_editor_version:1};
  view.config=config;config.xhs_modules=view.createDefaultModulesForStyle('composition',config);view.ensureUnifiedCoverVisuals(config);
  const caption=config.xhs_modules.find(m=>m.coverTextRole==='description');
  Object.assign(caption,{x:712,y:1200,w:296,manualSize:true,manualPosition:true});
  view.layoutCoverText(config);
  assert.equal(caption.x,712);assert.equal(caption.y,1200);assert.equal(caption.w,296);
  assert.equal(caption.h,view.measureCoverTextFrame(caption).height);
  const saved=view.normalizeConfig(JSON.parse(JSON.stringify(config)),'Test');view.layoutCoverText(saved);
  const restored=saved.xhs_modules.find(m=>m.id===caption.id);
  assert.equal(restored.x,712);assert.equal(restored.y,1200);assert.equal(restored.w,296);
  Object.assign(restored,{x:3000,y:3000});view.config=saved;view.constrainCoverTextModuleToSafeArea(restored);
  assert.equal(restored.x+restored.w,1008);assert.equal(restored.y+restored.h,1368);
}
{
  const config={...defaults,xhs_style:'composition',composition_variant:'headline-band',
    title:'AI工具用得越多，\n为什么你反而更忙？',subtitle:'职场 AI 技能提升指南',
    composition_description:'Caption',cover_editor_version:1};
  view.config=config;config.xhs_modules=view.createDefaultModulesForStyle('composition',config);
  view.ensureUnifiedCoverVisuals(config);
  const image=config.xhs_modules.find(m=>m.type==='image');
  Object.assign(image,{y:460,w:1080,h:810});
  const measure=view.measureCoverText;
  view.measureCoverText=(text,...args)=>text==='Caption'?{height:80,lines:2}:measure.call(view,text,...args);
  view.layoutCoverText(config);
  const sub=config.xhs_modules.find(m=>m.coverTextRole==='subtitle');
  assert.ok(Math.abs(image.y-sub.y-sub.h-48)<1e-8);assert.equal(image.w,1080);assert.equal(image.h,810);
  assert.ok(Math.abs(image.w/image.h-4/3)<1e-9);assert.equal(image.x,(1080-image.w)/2);
  const caption=config.xhs_modules.find(m=>m.coverTextRole==='description');
  assert.ok(Math.abs(caption.y-image.y-image.h-32)<1e-8);
  assert.ok(caption.y+caption.h<=1368);
  const geometry=JSON.stringify(config.xhs_modules);
  view.layoutCoverText(config);assert.equal(JSON.stringify(config.xhs_modules),geometry,'Reflow must be stable');
  view.measureCoverText=measure;
}
