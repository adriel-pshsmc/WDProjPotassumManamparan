document.addEventListener('DOMContentLoaded', function () {
  var path = window.location.pathname, page = path.substring(path.lastIndexOf('/') + 1) || 'index.html', links = document.querySelectorAll('.navigation-button');
  
  for (var i = 0; i < links.length; i++) {
    var a = links[i], href = a.getAttribute('href') || '', hrefPage = href.substring(href.lastIndexOf('/') + 1);
    
    if (hrefPage === page) {
      a.classList.add('active');
    }
  }

  var form = document.querySelector('.short-form');
  if (form) {
    // Handle submit: send credentials to server-side login endpoint
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = (document.getElementById('email') || {}).value || '';
      var password = (document.getElementById('password') || {}).value || '';

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        var orig = submitBtn.textContent;
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;
      }

      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      }).then(function (r) {
        return r.json().then(function (json) { return { ok: r.ok, status: r.status, body: json }; });
      }).then(function (resp) {
        if (!resp.ok) {
          alert(resp.body && resp.body.message ? resp.body.message : 'Login failed');
          if (submitBtn) { submitBtn.textContent = orig; submitBtn.disabled = false; }
          return;
        }
        // Success: redirect to profile page
        window.location.href = 'profile.html';
      }).catch(function (err) {
        console.error('Login error', err);
        alert('Login error, check console');
        if (submitBtn) { submitBtn.textContent = orig; submitBtn.disabled = false; }
      });
    });
  }

  // Register form handler (on register page)
  var regForm = document.querySelector('.register-form');
  if (regForm) {
    regForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var username = (document.getElementById('reg-username') || {}).value || '';
      var email = (document.getElementById('reg-email') || {}).value || '';
      var password = (document.getElementById('reg-password') || {}).value || '';
      var password2 = (document.getElementById('reg-password2') || {}).value || '';

      if (password !== password2) {
        alert('Passwords do not match');
        return;
      }

      var submitBtn = regForm.querySelector('button[type="submit"]');
      if (submitBtn) { var orig = submitBtn.textContent; submitBtn.textContent = 'Creating…'; submitBtn.disabled = true; }

      fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, email: email, password: password })
      }).then(function (r) {
        return r.json().then(function (json) { return { ok: r.ok, status: r.status, body: json }; });
      }).then(function (resp) {
        if (!resp.ok) {
          alert((resp.body && resp.body.message) || 'Registration failed');
          if (submitBtn) { submitBtn.textContent = orig; submitBtn.disabled = false; }
          return;
        }
        // success — redirect to profile
        window.location.href = 'profile.html';
      }).catch(function (err) {
        console.error('Signup error', err);
        alert('Signup error, check console');
        if (submitBtn) { submitBtn.textContent = orig; submitBtn.disabled = false; }
      });
    });
  }
});

function openNav() {
  var nav = document.getElementById('mySidenav'), main = document.getElementById('main');
  var navigationBarLogo = document.getElementById("navigation-bar-logo"), navigationBarTitle = document.getElementById("navigation-bar-title");
  
  if (nav) {
    nav.style.width = '250px';
  }

  if (main) {
    main.style.marginLeft = '250px';
  }
}

function closeNav() {
  var nav = document.getElementById('mySidenav');
  var main = document.getElementById('main');
  var navigationBarLogo = document.getElementById("navigation-bar-logo"), navigationBarTitle = document.getElementById("navigation-bar-title");

  if (nav) {
    nav.style.width = '0';
  }

  if (main) {
    main.style.marginLeft = '0';
  }
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