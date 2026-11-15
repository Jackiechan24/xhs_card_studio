# XHS Cards（小红卡）

Create Xiaohongshu covers and detail cards from Markdown notes. Choose an editable cover template, add images and highlights, and export individual cards or all pages as high-resolution PNG files.

## Installation

- **Community plugins**. In Obsidian desktop, open **Settings → Community plugins → Browse**, search for **XHS Cards**, then select **Install** and **Enable**.
- **Manual installation**. Download `main.js`, `manifest.json`, and `styles.css` from the same [GitHub release](https://github.com/Jackiechan24/xhs_card_studio/releases). Put them in `.obsidian/plugins/xhs-card-studio/` inside your vault, reload Obsidian, and enable the plugin under **Community plugins**.

## Usage

1. Open a Markdown note. Click the image icon in the left ribbon or run **打开小红书图文工作台** from the command palette to open the studio.
2. Choose a cover template under **封面模板**, enter your title and other cover text, and double-click an image frame to import an image.
3. Use the navigation buttons below the preview to see the detail cards generated from your note. In the detail view, choose a page style and font size.
4. Select **导出当前页到本地** to export the current page or **导出全部到本地** to export all pages. Filenames start with the preview page number followed by the page title.

The interface is in Simplified Chinese. Try the [example note](example-note.md) to see a cover and multiple detail pages.

### File access and network use

The plugin reads the active note, its properties, and referenced vault images. It copies images selected in the file picker into the vault and saves export files to the location you choose. **保存参数到笔记** writes layout settings to the note properties. If your note or cover uses an HTTP(S) image, preview or export may request that image from the host in its URL. Layout and PNG generation run locally.

## 中文使用说明

把 Obsidian 笔记排成小红书图文。用封面模板配置标题、配色和图片，再将 Markdown 正文排成详情页。支持预览、单页导出和批量导出 PNG。

## 快速开始

1. 安装并启用插件。手动安装时，将 `main.js`、`manifest.json` 和 `styles.css` 放入知识库的 `.obsidian/plugins/xhs-card-studio/`，然后在 Obsidian 的「第三方插件」中启用 XHS Cards。当前版本仅支持桌面端。
2. 打开一篇 Markdown 笔记，点击左侧功能区的图片图标，或在命令面板搜索「打开小红书图文工作台」。工作台默认在右侧栏打开，可用工作台左上角的按钮显示或隐藏设置。
3. 在封面页选择模板、填写文案，双击画布上的图片框上传图片。可以用 [示例笔记](example-note.md) 体验完整流程。
4. 用预览下方的「首页」、上一页和下一页按钮切换页面。左侧设置会随封面和详情页切换。

## 封面

| 菜单 | 当前功能 |
| --- | --- |
| 封面模板 | 上题中图型（默认）、双栏下图型、上图下题型、主辅三图型、右图左文型、左图右题型、满版叠字型、中段横幅型、杂志标题型、上下对比型。当前模板以蓝色高亮。 |
| 封面文案 | 编辑主标题、副标题、辅助文案和高亮字。高亮字填写主标题中的文字，可以跨主标题的手动换行匹配，也可以直接在主标题中用 `{{高亮文字}}` 标出。 |
| 封面主题色 | 常规模板提供冰蓝白、浅杏白、银灰白、薄荷白、浅粉白、浅灰绿，可自定义背景色和辅助色。杂志标题型提供强调色预设和发光强度。 |
| 封面字体色 | 提供纯色预设，也可分别设置主标题纯色、副标题、说明文案和高亮字。支持渐变的模板可选蓝紫橙黄、紫粉橙黄、深蓝渐变、蓝紫红橙，或设置渐变起点和终点。主标题渐变可以与独立高亮色同时使用。 |
| 自定义模块 | 添加图片、描边标签、胶囊标签和角标框。上传到自定义图片模块的图片按原图比例显示。 |

「重置当前模板」会恢复当前模板的默认样式并清空封面画布中的图片，保留封面文案。选中画布里的模块后，顶部工具栏会显示当前模块可用的控件。文字模块可调整字号、加粗（**B**）、对齐、行高和字距，标签还可编辑文案、颜色和字号。图片模块可更换图片，模板图片可恢复图片框。「复制」和「删除」位于工具栏右侧。

旧版封面布局会迁移到现行模板。点击「保存参数到笔记」后，旧版的通用坐标字段会从笔记属性中移除。

## 详情页

切换到详情页后，在左侧选择「模块化详情页」或「纯色文档型」，并在默认画布尺寸下选择 36 或 40 号正文。默认使用模块化详情页、字号 40，卡片背景为 `#F5F5F7`。

插件读取笔记正文，支持标题、加粗、列表、引用、代码块、表格和图片。库内图片可使用 Obsidian 的 `![[图片.png]]` 写法。正文会按卡片空间分页，单独一行的 `---` 可以主动分隔内容。

## 读取、保存和导出

- **读取当前笔记**。重新读取 Markdown 正文和配置，刷新预览。
- **保存参数到笔记**。将当前排版配置写入笔记顶部的属性区，保留 Markdown 正文。
- **导出当前页到本地**。保存当前预览页的 PNG，文件名使用该页在预览中的页码和标题。
- **导出全部到本地**。按预览顺序导出封面和详情页，例如 `01_封面标题.png`、`02_详情页标题.png`。支持选择本地目录，文件选择器不可用时使用应用的下载方式。

默认画布为 1080 × 1440，默认 3 倍导出为 3240 × 4320。可在插件设置中修改「图片素材目录」和「导出倍率」。上传的图片保存在库内素材目录，导出的 PNG 可写入你选择的库外位置。

## 文件访问与联网

- **笔记和库内文件**。插件读取当前打开的 Markdown 笔记、笔记属性和引用的库内图片，用于生成预览和 PNG。导入的图片会复制到配置的库内素材目录，工作台设置和排版草稿保存在 Obsidian 的本地插件数据中。点击「保存参数到笔记」会写入笔记属性区。
- **库外文件**。通过文件选择器导入库外图片时，插件将其复制到库内素材目录。旧配置中直接引用库外路径的图片，请通过文件选择器重新导入。导出的 PNG 会写入你选择的本地位置，文件选择器不可用时走应用的下载流程。
- **网络请求**。如果笔记或封面配置引用了 HTTP(S) 图片，预览或导出时可能向图片链接指向的站点请求该图片。请求目标由图片链接决定，插件的排版和导出在本地执行。使用库内或本地图片即可离线制作和导出。

## 字体

工作台、封面、详情页和导出统一使用本机 SF Pro 的字体声明。插件发布文件不包含字体。缺少 SF Pro 或个别字形时，系统会匹配可用字体，换行和分页可能随设备变化。

## 许可证

XHS Cards 的插件代码和项目文档采用 [MIT 许可证](LICENSE)。著作权声明为 © 赵同学AI。SF Pro 字体及其安装包适用 Apple 的许可条款。 [Apple 字体许可](https://developer.apple.com/fonts/)
