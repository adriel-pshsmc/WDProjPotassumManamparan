// Minimal script: active-link highlighting + sidenav helpers
document.addEventListener('DOMContentLoaded', function () {
  var path = window.location.pathname;
  var page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  var links = document.querySelectorAll('.navigation-button');
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    var href = a.getAttribute('href') || '';
    var hrefPage = href.substring(href.lastIndexOf('/') + 1);
    if (hrefPage === page) a.classList.add('active');
  }
});

function openNav() {
  var nav = document.getElementById('mySidenav');
  var main = document.getElementById('main');
  if (nav) nav.style.width = '250px';
  if (main) main.style.marginLeft = '250px';
}

function closeNav() {
  var nav = document.getElementById('mySidenav');
  var main = document.getElementById('main');
  if (nav) nav.style.width = '0';
  if (main) main.style.marginLeft = '0';
}

window.openNav = openNav;
window.closeNav = closeNav;

function toggleNav() {
  var nav = document.getElementById('mySidenav');
  var main = document.getElementById('main');
  var btn = document.getElementById('sidenavToggle');
  if (!nav) return;
  var isOpen = nav.style.width && nav.style.width !== '0px' && nav.style.width !== '';
  if (isOpen) {
    nav.style.width = '0';
    if (main) main.style.marginLeft = '0';
    if (btn) btn.textContent = '☰';
  } else {
    nav.style.width = '250px';
    if (main) main.style.marginLeft = '250px';
    if (btn) btn.textContent = '×';
  }
}

window.toggleNav = toggleNav;