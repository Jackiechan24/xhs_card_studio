const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const sandbox = {module:{exports:{}},console,require:()=>({Plugin:class{},ItemView:class{},PluginSettingTab:class{},Setting:class{},Notice:class{}})};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../main.js'),'utf8')+'\nmodule.exports=XHSCardStudioView;',sandbox);
const view = new sandbox.module.exports(null,{});
const cases = [
  ['# 标题 ==🔴高亮', '# 标题 ==🔴高亮=='],
  ['正文 ==🔵蓝色== 与 ==默认==', '正文 ==🔵蓝色== 与 ==默认=='],
  ['正文 ==加粗 **内容**', '正文 ==加粗 **内容**=='],
  ['正文 ==高亮  ', '正文 ==高亮==  '],
  ['`==代码`', '`==代码`'],
  ['\\==转义', '\\==转义'],
  ['```md\n==代码\n```\n==正文', '```md\n==代码\n```\n==正文=='],
  ['    ==缩进代码', '    ==缩进代码'],
  ['<pre>\n==代码\n</pre>\n==正文', '<pre>\n==代码\n</pre>\n==正文=='],
  ['<span title="==属性">正常</span>', '<span title="==属性">正常</span>'],
  ['==跨行\n高亮==', '==跨行\n高亮=='],
  ['===分隔符', '===分隔符'],
  ['正常正文', '正常正文']
];
for (const [source,expected] of cases) {
  const result=view.prepareDetailHighlightSource(source);
  assert.equal(result,expected,source);
  assert.equal(view.prepareDetailHighlightSource(result),result,'idempotent');
}
console.log('Markdown highlights: open line endings, colors, nested bold, code and escapes passed');
