// site/designs.js
// Alternate designs are available by direct URL only; Copper is the default.
(() => {
  const allowed = ['copper', 'organic', 'terminal', 'aurora', 'orbit'];
  function apply() {
    const requested = new URL(location.href).searchParams.get('design');
    document.documentElement.dataset.design = allowed.includes(requested) ? requested : 'copper';
  }
  window.addEventListener('popstate', apply);
  apply();
})();
