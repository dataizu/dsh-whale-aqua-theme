# AI 部署提示词

> 把下面代码块中的全部内容**原样复制**给你的 AI(DeepSeek Harness、Claude Code、ChatGPT 等均可),让它执行部署。

> **提示**:如果目标机器的 DeepSeek Harness 支持插件系统,推荐直接用**插件方式**安装(见仓库 README「🧩 插件方式安装」):`dsh plugin --profile web add https://github.com/dataizu/dsh-whale-aqua-theme`,一条命令完成、不修改任何 dist 文件。以下提示词用于传统 dist 补丁部署。

````markdown
# 任务:给本机的 DeepSeek Harness Web GUI 安装「macOS 主题 + 水中鲸鱼背景」

请按以下步骤完成部署。只改 DSH 的 Web 静态文件,不修改源码、不重启服务、不破坏原有文件(先备份)。

## 第 1 步:定位 Web 前端目录
找到 DeepSeek Harness 的 Web 静态资源目录(特征:包含 index.html,路径形如
`.../node_modules/@deepseek-ai/dsh-web-frontend/dist/`),记为 `<DIST>`。
查找顺序:
1. 询问用户 DSH 的部署位置,在其下找 `dist/index.html`;
2. 全局搜索名为 `dsh-web-frontend` 的目录
   (Windows:`where /r C:\ dsh-web-frontend` 或按用户指定盘符;macOS/Linux:`find / -type d -name "dsh-web-frontend" 2>/dev/null`);
3. 若仍找不到,请停下来询问用户路径,不要瞎猜。

## 第 2 步:获取主题文件
执行 `git clone https://github.com/dataizu/dsh-whale-aqua-theme` 到临时目录(记为 `<THEME>`)。
若网络受限,让用户手动下载该仓库的 zip 并解压,继续后面的步骤。

## 第 3 步:备份原文件
```
cp <DIST>/index.html <DIST>/index.html.bak
cp <DIST>/apple-style.css <DIST>/apple-style.css.bak 2>/dev/null || true
cp <DIST>/whale-icon.css <DIST>/whale-icon.css.bak 2>/dev/null || true
```

## 第 4 步:复制样式文件
```
cp <THEME>/apple-style.css  <DIST>/apple-style.css
cp <THEME>/whale-icon.css   <DIST>/whale-icon.css
```

## 第 5 步:把背景动画脚本拼进 index.html(幂等,可重复执行)
读取 `<DIST>/index.html` 后:
1. 若其中已包含 `whale-icon.css` 字样 → 跳过链接插入;否则在 `</head>` 之前插入两行:
   ```
   <link rel="stylesheet" href="/whale-icon.css" />
   <link rel="stylesheet" href="/apple-style.css" />
   ```
2. 若其中已包含 `dsh-bg-canvas` 字样 → 跳过脚本插入;否则把
   `<THEME>/install/background-snippet.html` 中 HTML 注释以下的**整个** `<script>...</script>` 块,
   插入到 `</body>` 之前。
3. 保存文件。

## 第 6 步:校验
1. 确认 `<DIST>` 下三个文件存在且非空;
2. 提取 index.html 中 `<script>` 的内容存为临时 .js,若本机有 node 则执行 `node --check` 校验语法;
3. 检查 index.html 里引用的 `/assets/*.js`、`/assets/*.css` 文件名,与 `<DIST>/assets/` 目录下的实际文件是否一致:
   - 一致 → 全部功能可用;
   - 不一致 → 说明本机 DSH 版本与主题开发版不同:**背景动画和鲸鱼发送按钮仍可用**,但皮肤
     `apple-style.css`(侧边栏/设置面板/轨迹样式)可能部分不生效。此时读取本机
     `dsh-web-frontend` 包目录下 package.json 的 `version` 字段,把版本号报告给用户,
     并说明"把该版本号反馈给主题作者即可生成适配版皮肤"。

## 第 7 步:验证与报告
1. 提醒用户硬刷新页面(Ctrl+Shift+R)查看效果;
2. 报告以下信息:定位到的 `<DIST>` 路径、执行了哪些修改、备份文件位置、DSH 前端版本号、是否有"皮肤可能不生效"的提示。
````
