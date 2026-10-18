# adapt/NOTES.md — region skin port to DSH 0.2.1-rc.2 (task-3)

Deliverables (this README's siblings):

| File | Merge target | Size |
| --- | --- | --- |
| `adapt/tokens.css` | `src/apple-style.css` | 17 rule blocks, ~129 declarations (task-4) |
| `adapt/regions.css` | `src/regions.css` | ~75 rules / 95 blocks (task-3, this file) |
| `adapt/whale-icon.css` | `src/whale-icon.css` | 17 blocks (task-3) |
| `adapt/token-diff.md` | (documentation, task-4) | — |

Injection order is `whale-icon → tokens → shell → regions` (src/apply.js), so
`regions.css` may override token-layer radii/surfaces, and `shell.css` still owns
the aquarium transparency.

Evidence base: `reports/map.json` (96 old classes → 0.2.1, 86 exact / 9 ambiguous
/ 1 missing), the 0.2.1 CSS bundles under `.scratch-asar/css-fmt/`, the shared
UI-kit CSS in `dsh-web-frontend/dist/assets/index-*.css`, the conversation/chat/
trajectory/settings JSX inside the 0.2.1 bundles, and the runtime DOM captures
in `.scratch-verify/logs/run1/` + `discover2-settings-rows.json`.

---

## 1. Selector adapter (0.2.1 hash families)

The whole mapping is repeated in the header comment of `regions.css` as the single
place to touch on the next runtime bump. Summary:

| Region | New owner (package / module) | Local prefix |
| --- | --- | --- |
| Sidebar | `dsh-client-ui-sidebar` / SidebarRoot | `_2H3hWW_*` |
| Session rows, workspace tree | `dsh-client-ui-workspace` / Rows, WorkspaceBrowser | `hIlkoa_*`, `_9lTDKa_*` |
| Conversation header + tabs + composer | `dsh-client-ui-conversation` / ConversationRoot, InputBar, ContextMeter, HeroShell | `Dc7zOa_*`, `RlGAzG_*`, `_2WTFBq_*`, `Hqq-bq_*` |
| User bubble + assistant markdown + think | `dsh-client-ui-chat` / MessageItem, AssistantMarkdown, ChatView, ReasoningRow | `cJsG2q_*`, `v5IAXa_*`, `xz4KEq_*`, `_3GBCTG_*` |
| Trajectory | `dsh-client-ui-trajectory` / TrajectoryTable | `haSm5q_*` |
| Settings nav/panel | `dsh-client-ui-settings-general` / SettingsRoot | `wCInkW_*` |
| Settings sections / notices | `dsh-client-ui-settings-account` | `_8RVnMG_*`, `KrzJGG_*` |
| Settings models | `dsh-client-ui-settings-models` | `_3nPmjq_*` |
| Appearance cubes | `dsh-client-ui-theme` / AppearanceRow | `v01cdW_*` |
| Directory picker | `dsh-client-ui-directory-picker-browse` | `Fv-y6W_*` |
| Tool rows | `dsh-client-ui-tool` / ToolRow | `pFy1Ka_*` |
| Cordis rows | `dsh-client-ui-cordis` / CordisRunRow | `_3jVEXG_*` |
| Menus / dialogs / toast / tooltip / pills / markdown (shared UI kit) | `dsh-web-frontend` desktop shell CSS | `_button_1rv3m_*`, `_list_4ub78_*`, `_item_4ub78_*`, `_check_4ub78_*`, `_surface_ri079_*`, `_dialog_o6lrb_*`, `_confirmation_cjd8z_*`, `_toast_l6cvn_*`, `_bubble_12mhf_*`, `_pill_1bqmh_*`, `_card_38jqx_*`, `_backdrop_19zw2_*`, `_close_19zw2_*`, `_markdown_1ypvv_*` |

## 2. Per-region status

Legend: **ported** = old rule carried over with a verified 0.2.1 selector;
**remapped** = same intent, new selector/hook; **new** = added for 0.2.1 or
desktop; **dropped** = no equivalent, with reason; **uncertain** = map.json
ambiguous or no runtime confirmation yet.

### 2.1 Sidebar — ported

| Old rule | New selector | Status |
| --- | --- | --- |
| `body .hHd-Xa_root{background:transparent}` | `body ._2H3hWW_root{background:transparent!important}` | **ported (PLATE EXCEPTION approved by Lead)** — 0.2.1 re-paints the opaque `--dsw-specific-sidebar-fill`; cleared so shell.css's glass `.BynINW_sidebarCol` shows. Windows drag band + caption probe unaffected (shell.css keeps the solid fill on the band). |
| `.hHd-Xa_root:not(.collapsed) .newSession` blue fill / white text / radius 8 + hover | `body ._2H3hWW_root:not(._2H3hWW_collapsed) ._2H3hWW_newSession` | **ported** — 0.2.1 defaults to a white elevated button (`--dsw-alias-button-elevated-fill`); old look was a filled blue button. Collapsed rail keeps the icon button untouched. |
| `.qDHVXG_sectionLabel{font-size:11px;font-weight:600}` | `._9lTDKa_sectionLabel` | **ported** |

### 2.2 Session rows / workspace tree — ported + semantically hardened

| Old rule | New selector | Status |
| --- | --- | --- |
| `YDXeBa_sessionRow.YDXeBa_selected` / `searchResultRow.YDXeBa_selected` → #0A60FF (dark #0A84FF), white text | `body [role=treeitem][data-row-key^="session:"][aria-selected=true]`, `... "search:" ...` + class fallbacks `.hIlkoa_sessionRow.hIlkoa_selected`, `.hIlkoa_searchResultRow.hIlkoa_selected` | **ported**, found both runtime hooks (map.json semantic + run1 DOM `hIlkoa_sessionRow hIlkoa_selected`). |
| selected `.time/.meta/.slot/.searchResultSnippet/.searchResultWorkspace` → white 78% | `[role=treeitem][aria-selected=true] .hIlkoa_time/…` | **ported** |
| `._matrix_10orb_4` / `._dot_10orb_3` white on selection | `[role=treeitem][aria-selected=true] .hIlkoa_dot{color:#fff}` | **remapped** — `_matrix_10orb_4` is map.json's only *missing* class (running matrix indicator removed in 0.2.1); the dot is the surviving indicator (`hIlkoa_dot`, workspace/Rows). |

### 2.3 Conversation header + view tabs — remapped (iOS segmented pill)

| Old rule | New selector | Status |
| --- | --- | --- |
| `.wSkVaW_header{border-bottom-color:transparent}`, `.wSkVaW_header:after{display:none}` | `.Dc7zOa_header{border-bottom-color:transparent}` + hide `:after` | **ported** |
| `.wSkVaW_tabs` pill container | `[data-conversation-tabs]` (**new semantic hook**, runtime: `div[role=tablist][data-conversation-tabs]`) | **remapped** |
| `.wSkVaW_tab` / `.wSkVaW_tabActive` | `[data-conversation-tabs] button[role=tab]` / `[aria-selected=true]` | **remapped** (0.2.1 renders `role=tab aria-selected`; runtime DOM verified in bundle JSX) |
| `.wSkVaW_tab:after{display:none}` (underline removal) | same `:after{display:none}` | **ported** |

### 2.4 Conversation frost — remapped

| Old rule | New selector | Status |
| --- | --- | --- |
| `.Md3f7G_scroll` frosted backdrop (white 88% + blur 20/saturate 180, dark #1C1C1E 88%) | `body [data-conversation-session] [data-conversation-scroll]` | **remapped** — selector-map.md §3.16 lists both `.xz4KEq_scroll` (inner) and `.Dc7zOa_scrollBody` (outer); the outer scrollport is what visually reads as the conversation surface and it also covers the composer-seat band, so the frost goes on the semantic `[data-conversation-scroll]` host. Scoped to an open session (`[data-conversation-session]` on the conversation body, emitted only when a session exists) so the hero/empty state keeps the full aquarium visible. |
| `.fV0t5q_root{background:layer-1}` | — | **dropped**: would re-opaque the conversation area shell.css keeps transparent (aquarium). |

### 2.5 User bubble (iMessage) — ported

| Old rule | New selector | Status |
| --- | --- | --- |
| `.gdEzaW_bubble` blue fill #007AFF, white text, radius 18, shadow | `.cJsG2q_bubble` (map exact-unique) | **ported** — 0.2.1 base bubble is pale `--dsw-specific-bubble`. NOTE: selector-map.md §3.9 suggests overriding the `--dsw-specific-bubble` token instead; deliberately **not** done because 0.2.1 reuses that token for goal cards and user-questions cards, where a saturated #007AFF fill + white text would be wrong (see token-diff §4). Per-region rule is the narrow, safe mapping. |
| `.gdEzaW_bubble ._markdown_1nba0_5` white; links; inline code; compaction children | `.cJsG2q_bubble ._markdown_1ypvv_5` (+ `a`, `:not(pre)>code`, `.cJsG2q_compaction*`) | **remapped** — markdown typography moved to the shared UI kit (`_markdown_1ypvv_5`). |

### 2.6 Assistant whale avatar — ported, **uncertain attach point**

Old `.Sxvs8a_root` (padding-left 36 + 20×14.7 px whale mask) → `body .v5IAXa_root`
(AssistantMarkdown root, map.json *recommended* for the ambiguous `Sxvs8a_root`).
The whale is the same inline SVG path as 0.1.x (data URI mask, no external asset).
**TODO(verify)**: old avatar hung off the assistant *row*; 0.2.1 renders reasoning
in its own node, so the avatar now starts at the answer markdown block. Compare
with `screenshots/light.png` on the bench. Alternative hook if it looks wrong:
`[data-conversation-region="chat"] [data-chat-flow-kind="assistant-step"]` (flow
item wrapper, verified in chat bundle JSX).

### 2.7 Think card — ported unchanged (selector is semantic)

`[data-variant="think"]` + `[data-state="running"]` still exist verbatim in 0.2.1
(ReasoningRow root: `data-variant="think" data-state="running" data-expanded
data-preview`, see chat bundle JSX). Old declarations carried over: layer-2 fill,
1px border, 3px blue left rail, radius 10, running tint/glow.

### 2.8 Trajectory — ported (badges + selection); card experiment dropped

| Old rule | New selector | Status |
| --- | --- | --- |
| `.Y0dWHa_kindTag` boxed 1.5px currentColor + 16% tint, radius 5, 20px, 11/700 | `.haSm5q_kindTag` (`[data-role-kind]` semantic) | **ported** — per-kind currentColor still driven by 0.2.1 classes (`haSm5q_user/_toolAmber/_contextGreen/...`). |
| `tr[data-selected=true]` blue 10% tint | `.haSm5q_table tbody tr[data-selected=true]` | **ported** |
| `tr[data-collapsed-summary] td` module-platform fill | same selector | **ported** |
| `.Y0dWHa_detailTabs/_detailTab/_detailTabActive` iOS pill tabs | `.haSm5q_detailTabs/_detailTab/_detailTabActive` (+`[role=tab][aria-selected=true]`) | **ported** — 0.2.1 base is underline tabs; old macOS style was pills with blue fill. |
| `.Y0dWHa_table` `border-spacing:0 6px`, per-event `td` cards, left rail line + kind dots, `turnRail{display:none}` | — | **dropped**: 0.2.1 redesigned the trajectory into a table with its own turn/selection rails (`.haSm5q_turnRail/.haSm5q_selectionRail`, `data-turn-start/end`, request boundaries). The reference screenshot intent is flat rows with boxed badges + blue selection (ported); the 0.1.x card/dot experiment would fight the new rail system. selector-map.md §3.12 notes the old `td.haSm5q_event::before/::after` timeline trick still works if the card/dot experiment is ever re-enabled. |

### 2.9 Settings — ported (macOS System Settings look)

| Old rule | New selector | Status |
| --- | --- | --- |
| `.VOzbGW_nav{width:220px}`, `.VOzbGW_navTitle{17/600}`, `.VOzbGW_navCell{radius 8}` | `.wCInkW_nav/_navTitle/_navCell` | **ported** |
| `.VOzbGW_navIcon` 26×26 squircle chip, module-platform fill, blue glyph; active = blue fill + white glyph | `.wCInkW_navIcon`, `.wCInkW_navCell.wCInkW_active .wCInkW_navIcon` (+`[aria-current=true]` fallback) | **ported** — 0.2.1 only sets `flex:none`. Runtime nav DOM: `button.wCInkW_navCell(.wCInkW_active) > svg.wCInkW_navIcon + span.wCInkW_navLabel` (discover2-settings-rows.json). Active row tint comes from the `--dsw-specific-sidebar-nav-item-active` token. |
| `.VOzbGW_panel` width 1000, radius 16 | `.wCInkW_panel` width 1000/max-width; radius via `--dsw-radius-panel:16px` token | **ported** |
| `.VOzbGW_trigger` radius 8 | `.wCInkW_trigger` | **ported** |
| `.VOzbGW_options ._root_19372_1 > button` bordered white menu button (28px, radius 8, border-l2, layer-1, shadow-lv1) | `.wCInkW_options ._root_4ub78_1 > button` | **uncertain / TODO(verify)** — 0.2.1 popup-select root is `_root_4ub78_1` (map exact), but the runtime capture shows per-tab selector buttons (`Hefa_q_selector`, `_3HsggG_selector`, …); if they are not wrapped, the rule matches nothing (no harm). |
| `._WvWnq_section` grouped card (layer-1, hairline, radius 10, 16px padding) | all six per-tab section modules: `._8RVnMG_section, .zZnCHW_section, ._3nPmjq_section, .RotMhW_section, .amjGKq_section, .pbObnW_section` | **ported** — runtime-dom.md §9 / selector-map.md §3.13: 0.2.1 has no shared SettingsSection class, so the old look must be applied to every per-tab section container. The final 0.1.x cascade was the card rule (it came after the divider rule), so the card wins. |
| `._card_1b2ny_13` radius 10 (owner guess AccountNotice) | `.KrzJGG_card` (AccountNotice card) | **ported** — map.json's generic pick (`_card_38jqx_9`, a hovercard) is wrong by owner; kept the semantic owner match. |
| `.ydkMvW_section` divider rules | — | **dropped**: runtime-dom/mapper say to apply separators "likewise", but the final 0.1.x cascade replaced the account divider with the card, and 0.2.1 rows already carry their own hairlines (`Hefa_q_row` etc.). Applying both would double-space every tab. Re-add per-tab only if the bench shows missing group separation. |
| `zGbnIq_*` radii: buttons 10, rowActions 8, add* 8, rowCard/editor/addCard/setupCard 10, modelEntry 6 | `._3nPmjq_*` | **ported** (base values differ: rowCard radius-xl 18, editor/addCard/setupCard radius-lg 14, modelEntry radius-lg 14, addButton radius-lg 14) |
| `._8HJdBW_themeCube` radius 10, 12/24 padding, 13/18 font; selected = blue fill + white + ✓ | `.v01cdW_themeCube` / `.v01cdW_selected` (+`::after` ✓) | **ported** |

### 2.10 Composer — ported (jelly glow)

| Old rule | New selector | Status |
| --- | --- | --- |
| `[data-composer-card].uV2eYG_card{border-radius:18px}` | `[data-composer-card]` | **ported** — 0.2.1 renders `data-composer-card="true"` (runtime) and radius `--dsw-radius-panel` (16); 18 restored. |
| `[data-composer-card]::after` jelly gradient ring | same | **ported** |
| `:has(textarea:focus)` focus border + halo | `:has([data-composer-input]:focus)` | **remapped** — 0.2.1 editor is a contenteditable div `[data-composer-input]` (runtime markup). |
| `:has(rect)` running breathe + flow | same | **ported** — the send/stop button `.RlGAzG_primary` swaps to the stop `<rect>` when running (bundle JSX; confirmed by Lead). |
| `:has(textarea[data-phase="submitting"])` white send shimmer | — | **dropped / TODO(verify)**: 0.2.1 keeps the submit phase in JS state, no DOM attribute; covered by the running glow until a hook appears. |
| keyframes `dsh-jelly-breathe/_flow/_send`, reduced-motion guard | same (minus `_send`) | **ported** except `_send` (see above) |

### 2.11 Shared UI kit — ported

| Old rule | New selector | Status |
| --- | --- | --- |
| `_list_19372_8/_submenu_19372_9` radius 10 + `saturate(180%) blur(30px)` | radius: `._surface_ri079_1`; fill/blur: moved to tokens (`--dsw-menu-surface-fill`, `--dsw-menu-backdrop-filter`) | **remapped/ported** — 0.2.1 paints menus via `._material_ri079_21` using those tokens; radius token is 14 → 10 restored. TODO(verify) on the menu surface class. |
| `_item_19372_91` min-height/radius, dense 26/5, `_check` blue | `._item_4ub78_90`, `._denseList_4ub78_124 ._item_4ub78_90`, `._check_4ub78_179` | **ported** |
| `_dialog_15u5s_22` radius 16 | `._dialog_o6lrb_33` (uses `--dsw-radius-panel`) | **covered by token** (no rule needed) |
| `_confirmation_1nu42_1` radius 16 | `._confirmation_cjd8z_1` (child of dialog) | **covered by token** |
| `_toast_fvpz7_7` radius 10 | `._toast_l6cvn_6` | **ported** |
| `_bubble_owhem_8` radius 6 | `._bubble_12mhf_1` (tooltip) | **ported** |
| `_pill_e3ygd_1` radius 8 | `._pill_1bqmh_1` | **ported** |
| `_card_1b2ny_13` (hovercard alternative) radius 10 | `._card_38jqx_9` | **ported** |
| `_button_kz6gm_4` radius 10 / `_sm` radius 8 | `._button_1rv3m_2` / `._sm_1rv3m_28` | **covered by tokens** (radius-md 10 / radius-sm 8) |
| `_backdrop_18d3q_1` backdrop-blur | `._backdrop_19zw2_2` | **ported** (uses `--dsw-mask-blur` token) |
| `_close_18d3q_30:hover` | `._close_19zw2_37:hover` | **ported** |

### 2.12 Small regions — ported

- context meter bar (`_2WTFBq_bar`) radius 10
- hero workspace trigger (`Hqq-bq_workspace`) + directory modal input (`Hqq-bq_modalInput`) radius 10
- tool io card (`pFy1Ka_ioCard`) radius 10
- cordis run rows (`_3jVEXG_business` radius 10, `_3jVEXG_message` radius 6)
- directory browser rows selected tint (`Fv-y6W_rowSelected`), `createInput` radius 10, `loadingFloat` radius 8 + hairline border

## 3. Dropped and why (full list)

1. `.fV0t5q_root{background:layer-1}` — would re-opaque the transparent conversation shell.
2. `.pI_x6G_frame{background:transparent}` — old 0.1.x app-frame class; the desktop shell layer (`BynINW_*`) is owned by `shell.css`.
3. Trajectory per-event card/timeline-dot block (old lines ~212–223) — 0.2.1 redesign; see §2.8.
4. `._7yHdaG_panel` bottom-sheet corners — map ambiguous (plugin manager is a page in 0.2.1).
5. `.bqrRRG_card` radius 14 / `.qSYn7G_card` shadow — ambiguous card modules; radius-lg/elevation tokens already render 14px/shadows.
6. `.ydkMvW_section` divider rules — ambiguous per-tab sections; 0.2.1 rows have their own hairlines.
7. `#dsh-bg-canvas` CSS — canvas is positioned inline by `background.js` (`position:fixed; inset:0; z-index:-1`).
8. `::-webkit-scrollbar{width:6px;height:6px}` — token `--dsh-scrollbar-width:6px` (tokens.css) already feeds 0.2.1's scrollbar rules.
9. `[data-composer-card]:has(textarea[data-phase="submitting"])` white shimmer — no DOM hook in 0.2.1 (see §2.10).
10. All 0.1.x CSS-module hashes (`wSkVaW_*`, `VOzbGW_*`, `YDXeBa_*`, `gdEzaW_*`, `Sxvs8a_*`, `Y0dWHa_*`, `hHd-Xa_*`, `_dialog_15u5s_22`, …) are dead in 0.2.1 — zero hits, replaced by the adapter table.

## 4. Changes / additions specific to 0.2.1 + desktop

- **Plate exception (approved)**: `._2H3hWW_root` opaque background cleared (§2.1). No other plate is re-opened; the `.Dc7zOa_composerSeat` sticky gradient (uses `--dsw-alias-bg-base`) is intentionally left to 0.2.1 — it only appears in `[data-phase=active]` and sits under the composer card. If the bench shows a hard white band under the composer, the optional override is: `body .Dc7zOa_root[data-phase=active] .Dc7zOa_composerSeat, body .Dc7zOa_embeddedBody[data-content-phase=active] .Dc7zOa_composerSeat{background:linear-gradient(180deg,rgba(255,255,255,0) 0,rgba(255,255,255,.88) 36px)}` + dark equivalent — **not shipped** until visually verified.
- **macOS identity at token level**: composer/bubble radii, menu material, grouped card tokens, Apple accent/focus ring — see `tokens.css`/`token-diff.md`; regions only restores per-surface values.
- **Windows chrome untouched**: no rules on `[data-windows-titlebar]`, no drag-region changes; the 40px band + native caption probe stay exactly as `shell.css` left them.
- **Accessibility**: composer glow respects `prefers-reduced-motion` (same guard as 0.1.x). No `!important` except the approved sidebar plate and shell-owned transparency (none added here).

## 5. Unverified / TODO (for the bench pass)

1. Assistant whale avatar attach point (`v5IAXa_root` vs `[data-chat-flow-kind=assistant-step]`) — §2.6.
2. Settings popup-select trigger look; the `.wCInkW_options ._root_4ub78_1 > button` rule may not match 0.2.1's per-tab selectors — §2.9.
3. Menu surface radius (`._surface_ri079_1` = 10px) and dense item heights on real menus.
4. Composer `data-phase=active` sticky band vs frosted conversation seam (§4 optional rule).
5. Trajectory detail-tab pills inside the new table/toolbar layout — verify no clipping at 38px height.
6. Dark mode: all light rules have token-driven counterparts, but the bench should screenshot dark chat / dark settings / dark trajectory.
7. Conversation with actual messages is required to verify §2.5/2.6/2.8 (run1 only captured the hero state).
