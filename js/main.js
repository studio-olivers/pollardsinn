(function () {
  var toggle = document.querySelector('.nav__toggle');
  var links = document.getElementById('navLinks');
  var closeBtn = document.getElementById('navClose');
  if (toggle && links) {
    var overlay = document.createElement('div');
    overlay.className = 'nav__overlay';
    document.body.appendChild(overlay);

    function openMenu() {
      links.classList.add('open');
      overlay.classList.add('open');
      document.body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      links.classList.remove('open');
      overlay.classList.remove('open');
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', openMenu);
    overlay.addEventListener('click', closeMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  var viewer = document.querySelector('.menu-viewer');
  if (viewer) {
    var tabs = viewer.querySelectorAll('.menu-tab');
    var panels = viewer.querySelectorAll('.menu-panel');
    var select = viewer.querySelector('.menu-select');

    function show(key) {
      tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.menu === key); });
      panels.forEach(function (p) { p.classList.toggle('active', p.dataset.menu === key); });
      if (select && select.value !== key) select.value = key;
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { show(t.dataset.menu); });
    });
    if (select) {
      select.addEventListener('change', function () { show(select.value); });
    }
  }

  // Lightbox for menu pages and gallery photos. The markup keeps its plain
  // <a href="..." target="_blank">, so with JS off the image still opens in a
  // new tab — this just intercepts the click and shows it in place instead.
  var triggers = document.querySelectorAll('a.menu-panel__page, a.lightbox-link');
  if (triggers.length) {
    var box = null;
    var stage, boxImg, btnClose, btnPrev, btnNext, counter;
    var group = [];
    var current = 0;
    var lastFocused = null;

    function build() {
      box = document.createElement('div');
      box.className = 'lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.innerHTML =
        '<div class="lightbox__stage"><img class="lightbox__image" alt=""></div>' +
        '<button class="lightbox__close" type="button" aria-label="Close"><i class="bi bi-x-lg"></i></button>' +
        '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous page"><i class="bi bi-chevron-left"></i></button>' +
        '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next page"><i class="bi bi-chevron-right"></i></button>' +
        '<p class="lightbox__counter" aria-live="polite"></p>';
      document.body.appendChild(box);

      stage = box.querySelector('.lightbox__stage');
      boxImg = box.querySelector('.lightbox__image');
      btnClose = box.querySelector('.lightbox__close');
      btnPrev = box.querySelector('.lightbox__nav--prev');
      btnNext = box.querySelector('.lightbox__nav--next');
      counter = box.querySelector('.lightbox__counter');

      btnClose.addEventListener('click', closeBox);
      btnPrev.addEventListener('click', function () { step(-1); });
      btnNext.addEventListener('click', function () { step(1); });
      boxImg.addEventListener('click', toggleZoom);
      // Anywhere that isn't the image itself dismisses.
      box.addEventListener('click', function (e) {
        if (e.target === box || e.target === stage) closeBox();
      });
    }

    function unzoom() {
      box.classList.remove('is-zoomed');
      stage.scrollTop = 0;
      stage.scrollLeft = 0;
    }

    // Zoomed means the image renders at the full file's own pixel size and the
    // stage scrolls — that's what makes small menu type readable on a phone.
    function toggleZoom() {
      if (box.classList.contains('is-zoomed')) {
        unzoom();
        return;
      }
      box.classList.add('is-zoomed');
      stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
    }

    function showAt(i) {
      current = i;
      var link = group[current];
      var thumb = link.querySelector('img');
      unzoom();
      boxImg.src = link.getAttribute('href');
      boxImg.alt = thumb ? thumb.getAttribute('alt') || '' : '';
      box.setAttribute('aria-label', boxImg.alt || 'Enlarged image');

      var many = group.length > 1;
      btnPrev.hidden = !many;
      btnNext.hidden = !many;
      counter.hidden = !many;
      counter.textContent = many ? (current + 1) + ' / ' + group.length : '';
    }

    function step(delta) {
      if (group.length < 2) return;
      showAt((current + delta + group.length) % group.length);
    }

    function openBox(link) {
      if (!box) build();
      // A menu panel or the gallery grid is the set you page through.
      var scope = link.closest ? link.closest('.menu-panel, .gallery-grid') : null;
      var found = scope ? scope.querySelectorAll('a.menu-panel__page, a.lightbox-link') : [link];
      group = Array.prototype.slice.call(found);
      // Remember the trigger itself; a click doesn't reliably focus it, so
      // document.activeElement would often be the body here.
      lastFocused = link;
      showAt(Math.max(0, group.indexOf(link)));
      document.body.classList.add('lightbox-open');
      box.classList.add('open');
      // The box is visibility:hidden until styles recalculate, and focus is
      // ignored inside a hidden element — force a reflow first.
      void box.offsetWidth;
      btnClose.focus();
    }

    function closeBox() {
      if (!box || !box.classList.contains('open')) return;
      box.classList.remove('open');
      unzoom();
      document.body.classList.remove('lightbox-open');
      boxImg.removeAttribute('src');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function trapFocus(e) {
      var items = [];
      [btnClose, btnPrev, btnNext].forEach(function (el) {
        if (!el.hidden) items.push(el);
      });
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    triggers.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        openBox(link);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (!box || !box.classList.contains('open')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeBox();
      } else if (e.key === 'ArrowLeft') {
        step(-1);
      } else if (e.key === 'ArrowRight') {
        step(1);
      } else if (e.key === 'Tab') {
        trapFocus(e);
      }
    });
  }
})();
