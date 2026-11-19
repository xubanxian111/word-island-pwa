# PWA 部署说明

## 必须满足

- 使用 HTTPS。
- 保持当前目录结构，尤其是 `manifest.webmanifest`、`sw.js` 和根目录中的 PNG 图标。
- `index.html` 必须位于网站根目录。
- 部署后固定使用同一个域名，因为学习记录按网站来源保存在设备本地。
- `.webmanifest` 建议返回 `application/manifest+json`，PNG 图标返回 `image/png`。

项目不需要后端、数据库或构建命令。

## Cloudflare Pages

1. 新建 Pages 项目并上传本目录。
2. 框架预设选择 `None`。
3. 构建命令留空。
4. 输出目录填写 `.`。
5. 部署完成后，用 iPad Safari 打开生成的 HTTPS 地址。

## GitHub Pages

1. 将生产文件提交到仓库根目录。
2. 在仓库 `Settings → Pages` 中选择从分支根目录发布。
3. 打开 GitHub Pages 提供的 HTTPS 地址。

## iPad 安装

1. 用 Safari 打开部署地址。
2. 点击“分享”。
3. 选择“添加到主屏幕”。
4. 从主屏幕打开一次，等待离线缓存完成。
5. 在家长中心确认显示“已安装 · 独立窗口运行”。

不要在长期使用时更换域名；如必须迁移，先使用“导出学习记录”，在新地址中再“导入学习记录”。

## 发布前检查

- `manifest.webmanifest` 和全部根目录 PNG 图标均返回 200。
- 开发者工具 Application 面板中 Service Worker 为 activated。
- 首次联网加载后切换到离线，刷新仍能打开。
- Safari 分享菜单能添加主屏幕。
- iPad 横屏和竖屏都能正常完成一组 10 词学习。
