/* Existing Page co-editing affordance, limited to a local working preview.
 * Compare saved markup so a URL-only edit is as visible as a text edit. */
(function () {
  var host = location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") return;
  function blocks(doc) {
    var values = {};
    doc.querySelectorAll('[data-block]').forEach(function (el) {
      var clone = el.cloneNode(true);
      clone.classList.remove('amble-hands');
      values[el.getAttribute('data-block')] = clone.innerHTML;
    });
    return values;
  }
  var current = blocks(document), touched = [];
  try { touched = JSON.parse(sessionStorage.getItem('amble-hands') || '[]'); sessionStorage.removeItem('amble-hands'); } catch (e) {}
  document.querySelectorAll('[data-block]').forEach(function (el) {
    if (touched.indexOf(el.getAttribute('data-block')) !== -1) el.classList.add('amble-hands');
  });
  setTimeout(function () {document.querySelectorAll('.amble-hands').forEach(function (el) {el.classList.remove('amble-hands');});}, 8000);
  setInterval(function () {
    if (document.hidden) return;
    fetch(location.pathname, {cache:'no-store'}).then(function (r) {if (!r.ok) throw Error(); return r.text();}).then(function (text) {
      var next = blocks(new DOMParser().parseFromString(text, 'text/html'));
      var names = Array.from(new Set(Object.keys(current).concat(Object.keys(next))));
      var changed = names.filter(function (name) {return current[name] !== next[name];});
      if (changed.length) {
        try {sessionStorage.setItem('amble-hands', JSON.stringify(changed));} catch (e) {}
        location.reload();
      }
    }).catch(function () {});
  },1500);
})();
