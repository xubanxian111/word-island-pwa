# 词汇小岛

面向 9 岁四年级孩子的英语词汇冲刺应用。目标是用 12 周完成 1000 个高频词的听、读和主动回忆训练，并把拼写放到后续阶段。

## 当前版本

- 零依赖静态 PWA，可添加到 iPad/iPhone 主屏幕，并支持全屏、横竖屏和离线启动。
- 儿童端包含每日任务、10 词分组学习、随机顺序测验、间隔复习、学习地图和完成总结。
- 家长端包含总进度、稳定词数、复习积压、累计正确率、近七天节奏、学习设置、记录导出与导入。
- 学习进度使用 `localStorage` 保存在本机，不上传姓名或学习记录。
- 首批内置 130 个高质量核心词条，覆盖 12 个主题。每个词包含中文释义、表情图、英文例句和中文例句。
- 复习间隔为 1、3、7、14、30 天；答错后 12 小时重新进入复习。
- 已提供 152、167、180、192、512 像素 PNG 图标和 maskable 图标。

## 运行

在 Mac 上可以直接双击 `start.command`，它会启动本机服务并打开应用。推荐用这种方式，因为浏览器对 Service Worker 和本地存储的支持更稳定。

也可以手动运行：

```bash
python3 -m http.server 8080
```

然后打开 `http://localhost:8080`。

## 安装到 iPad

1. 将项目部署到一个固定的 HTTPS 静态网站地址。
2. 用 iPad 的 Safari 打开该地址。
3. 点击“分享”，选择“添加到主屏幕”。
4. 从主屏幕打开一次，等待离线缓存完成。

正式安装和 Service Worker 需要使用 HTTPS。局域网 HTTP 地址可以用于普通浏览测试，但不应作为长期安装地址。学习记录按网站域名保存；更换域名前应先导出备份。

## 测试

工作区自带 Node.js 位于 Codex 运行时中。界面测试会自动启动临时本地服务器，并验证 PWA 清单、图标、Service Worker、离线启动、刷新恢复和备份导入：

```bash
NODE_BIN="/Users/xumo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
"$NODE_BIN" tests/logic.test.js
NODE_PATH="/Users/xumo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules" \
  "$NODE_BIN" tests/ui.spec.js
```

## 文件结构

- `index.html`：儿童端、家长端、学习会话和组件结构
- `styles.css`：响应式界面、夜间配色和动效
- `data.js`：首批词库
- `logic.js`：间隔复习、答题选项和日期逻辑
- `app.js`：会话状态、页面渲染、语音朗读和本机持久化
- `sw.js`：离线缓存
- `manifest.webmanifest`：PWA 安装配置
- 根目录 `icon-*.png`：iPad 与 PWA 图标
- `scripts/generate-icons.js`：从 SVG 重新生成安装图标

## 内容扩充约定

词条结构如下：

```js
{
  id: 1,
  word: "hello",
  meaning: "你好",
  emoji: "👋",
  category: "日常核心",
  example: "Hello, my name is Mia.",
  exampleZh: "你好，我叫米娅。"
}
```

扩充到 1000 词时应继续坚持：

- 每个词头先只教一个主要义项。
- 例句尽量只比孩子当前水平多一个生词。
- 按 200 词一批制作，并做重复词、年龄适宜性和中文释义审校。
- 不在未验证内容质量前直接批量导入生成式释义。

## 下一批工作

1. 将词库从首批 130 词扩充到 1000 词，并增加内容校验脚本。
2. 增加“家长可审阅例句/音频”的内容管理入口。
3. 增加 4 周与 12 周随机抽测，计算延迟保持率。
4. 在真实 iPad 上测试横竖屏、文字朗读口音和 Safari“添加到主屏幕”流程。
