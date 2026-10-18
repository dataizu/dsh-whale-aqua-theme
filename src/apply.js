function apply(ctx) {
  // 皮肤样式注入（卸载时移除；先清理可能残留的同名 <style>）。
  // 顺序：发送按钮 → 设计令牌 → 外壳/桌面层 → 分区皮肤。
  ctx.effect(() => {
    var stale = document.querySelectorAll('style[data-dsh-whale-aqua]');
    for (var i = 0; i < stale.length; i++) {
      if (stale[i].parentNode) stale[i].parentNode.removeChild(stale[i]);
    }
    var el = document.createElement('style');
    el.setAttribute('data-dsh-whale-aqua', THEME_VERSION);
    el.textContent = [WHALE_ICON_CSS, TOKENS_CSS, SHELL_CSS, REGIONS_CSS].join('\n');
    document.head.appendChild(el);
    return () => { if (el.parentNode) el.parentNode.removeChild(el); };
  });

  // 背景 + 发送按钮动画：startBackground 返回清理函数，直接作为 effect disposer。
  ctx.effect(startBackground);
}
