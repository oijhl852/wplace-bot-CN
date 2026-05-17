# Wplace-机器人

> 本项目是 [SoundOfTheSky/wplace-bot](https://github.com/SoundOfTheSky/wplace-bot) 的中文分支（Fork）。
> 原项目采用 MPL-2.0 许可证，感谢原作者 [SoundOfTheSky](https://github.com/SoundOfTheSky) 的出色工作。

### 本分支修改内容

- **🌐 全界面中文化** — UI 按钮、选项、状态提示、错误消息等全部翻译为中文
- **🙈 新增隐藏图片按钮** — 每张图片可临时隐藏叠加层（👁 / 👁‍🗨 切换），隐藏后仍可随时取消隐藏
- **🔗 安装链接更新** — 自动更新指向本仓库，不会被原仓库覆盖
- **🎚️ 操作体验优化** — 不透明度滑块添加防抖，避免频繁重绘；出错时状态栏红字闪烁提醒
- **📊 顶栏进度显示** — 每张图片顶栏最左侧实时显示已绘制像素数，格式为 `(已完成/总数)`

## 功能

1. 自动绘制（仍需手动点击验证码）
2. 支持多张图片
3. 多种绘制策略
4. 自动图片转换/缩放
5. 建议购买的颜料颜色
6. 可选验证码绕过

## 安装

1. 安装 TamperMonkey 浏览器扩展：[Chrome](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)|[Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
2. [打开此链接](https://github.com/oijhl852/wplace-bot-CN/raw/refs/heads/main/dist.user.js)
3. 点击安装
4. 允许用户脚本
   1. Chrome: 设置 > 扩展程序 > 管理扩展程序 > Tampermonkey > 详情 > 允许用户脚本
   2. Firefox: 设置 > 扩展和主题 > Tampermonkey > 允许用户脚本

## 使用方法

1. 添加图片或导入已导出的 `###.wbot` 文件。
2. 拖拽图片及其边缘进行定位。
3. 调整图片顺序。
4. 颜色条支持拖拽排序。别忘了勾选"按顺序绘制颜色"。
5. 替代颜色按钮：顶部按钮购买，底部按钮禁用。
6. 导出图片。导出时包含亮度/缩放设置及 `###.wbot` 配置文件。
7. 锁定图片防止意外编辑并允许点击穿透。
8. 隐藏图片临时隐藏叠加层。
9. 删除图片。
10. 最后点击"绘制"开始绘制 :)

![使用说明](https://github.com/oijhl852/wplace-bot-CN/raw/refs/heads/main/Instruction.png)

## 验证码绕过

推荐使用简单的自动点击器，操作步骤如下：

1. 刷新标签页 "CTRL+SHIFT"，等待 10 秒（可选但推荐）
2. 点击"绘制"，等待 15 秒
3. 点击验证码，等待 5 秒
4. 点击"上色"，等待 30 分钟
5. 重复

另外，我使用 [Firefox Multi-Account Containers](https://addons.mozilla.org/en-GB/firefox/addon/multi-account-containers/) 在多个标签页中分别打开机器人。

## 已知问题

1. 网站上的会话结束后，机器人自然停止。
2. 非常大的图片会导致一切卡顿。

## 参与开发

1. 安装 [Bun](https://bun.sh/)
2. 安装依赖 `bun i`
3. 在 `script.txt` 中升级版本号
4. 代码检查 `bun run lint`
5. 构建 `bun start`
