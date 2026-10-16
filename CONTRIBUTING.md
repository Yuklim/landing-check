# 提交与协作规范（CONTRIBUTING）

本文件说明本仓库**以后怎么提交代码**。目标：保持 `main` 始终可运行，让 git 历史清晰呈现「一功能一分支、PR 合并」的协作过程。

---

## 一、核心原则

1. **不直接往 `main` 提交。** 任何改动都先开一条 `feature/*` 分支，经 Pull Request 合并回 `main`。
2. **一个功能 = 一条分支 = 一个 PR。** 分支尽量只做一件事，便于评审和回滚。
3. **PR 用「合并提交」方式合并**（merge commit / `--no-ff`），保留分支拓扑，让协作图看得见。
4. **`main` 永远能跑。** 合并前本地务必跑过测试（见第六节）。
5. **绝不 `force-push` 到共享分支**（`main` 及任何别人可能在用的分支）。历史改写会冲垮队友的本地仓库。

---

## 二、日常提交流程（标准命令）

```bash
# 1. 从最新 main 切功能分支
git switch main
git pull
git switch -c feature/<简短功能名>

# 2. 只提交本功能相关的文件
git add <本功能的文件...>
git commit            # 提交信息见第四节

# 3. 推送并开 PR
git push -u origin feature/<简短功能名>
gh pr create --base main --head feature/<简短功能名> --title "<标题>" --body "<一句话说明>"

# 4. 本地跑测试通过后，合并 PR（保留合并提交）
gh pr merge feature/<简短功能名> --merge

# 5. 同步本地 main
git switch main
git pull
```

> 分支保护导致 `gh pr merge` 报 not mergeable 时，确认检查通过后可加 `--admin`。

---

## 三、分支命名

| 前缀 | 用途 | 示例 |
|---|---|---|
| `feature/` | 新功能 / 新模块 | `feature/amap-maps`、`feature/ctrip-mcp` |
| `fix/` | 修 bug | `fix/preflight-crash` |
| `docs/` | 文档 | `docs/contributing` |

名字用英文小写加连字符，见名知意。

---

## 四、提交信息规范

- **标题**一行讲清楚「做了什么」，中文英文都可以，不写流水账。
- 需要时**空一行后**用正文按模块分点。
- **结尾放 `Co-authored-by` 署名**（这是 git 识别共同作者的 trailer，GitHub 会显示多人贡献）：
  - 真实参与该改动的队友，用**各自已在 GitHub 验证的邮箱**；
  - 若用了 AI 辅助，按各自会话的设置署名。

示例：

```
高德路线数据层：amap_routes 路线接口与 h5 运行时路线数据

Co-authored-by: Xueqi HE <182043919+firn7q@users.noreply.github.com>
Co-authored-by: Icecream0507 <161185842+Icecream0507@users.noreply.github.com>
```

> ⚠️ 只给**确实参与**该改动的人挂 co-author，不要凭空挂名。

---

## 五、共享文件冲突的处理

当多人改**同一个文件**（如 `h5/app.js`、`backend/app.py`）时：

- **不要按 hunk 硬拆成多条分支**——容易把别人的半成品提交坏。
- 独立的新文件/新模块（如 `backend/ctrip_mcp.py`）各自成分支；
- 交织在共享文件里的改动，**由一个人在一条「集成分支」上统一提交**，并给相关贡献者挂 `Co-authored-by`。

---

## 六、提交前检查清单

提交 / 合并前，逐项确认：

- [ ] **后端测试通过**：`cd backend && python3 -m pytest -q` —— 基线 **87 passed / 65 skipped**，不得变差。
- [ ] **设计稿已存盘**：改了设计就必须先在 **Pen 编辑器里保存 `appearance.pen`**，否则磁盘文件是旧的、改动会丢。提交前用 `git diff --stat` 确认 `appearance.pen` 显示为已修改。
- [ ] **H5 产物已重建**：改了 H5 后跑 `python3 h5/build_h5.py`。注意 **`h5/index.html` 是生成产物，不要手改**；`h5/screens-css.html` 已被 `.gitignore`，不纳入提交。
- [ ] **推送前确认提交邮箱已在 GitHub 验证**（否则 GitHub 不会把提交归属到你名下）。本仓库现有贡献者身份：
  - `Yuklim <1667894948@qq.com>`
  - `Xueqi HE <182043919+firn7q@users.noreply.github.com>`
  - `Icecream0507 <161185842+Icecream0507@users.noreply.github.com>`

---

## 七、多人 / 多窗口并行时的约定

本项目常有多人（或多个 AI 会话）同时在**同一个工作目录**里改。为避免互相覆盖：

1. **同一时刻只让一个人执行 git 操作**（切分支 / 提交 / 合并）。共享工作区里多人同时动 git 会互相打架。
2. 开始一轮集成提交前，**先约定其他人暂停写文件**，提交合并完成后再通知恢复。
3. **`h5/index.html` 由 `build_h5.py` 生成**，谁跑构建谁会覆盖它——跑构建前先打招呼。
4. 不在共享工作区用 `git reset --hard` / `git checkout -- <file>` 丢弃别人未提交的改动。

---

## 八、禁止事项

- ❌ 直接 `commit` / `push` 到 `main`
- ❌ 对 `main` 或任何共享分支 `force-push`、改写已推送的历史
- ❌ 手改生成产物（`h5/index.html`）
- ❌ 给未参与者挂 `Co-authored-by`
- ❌ 在别人未提交改动还在工作区时做破坏性 git 操作
