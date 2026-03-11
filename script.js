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
    try {
      var saved = localStorage.getItem('su_signin');
      if (saved) {
        var data = JSON.parse(saved);
        if (data.email) {
          var email = document.getElementById('email'); 
          if (email){email.value = data.email};
        }
        if (data.password) {
          var password = document.getElementById('password'); 
          if (password){password.value = data.password};
        }
        if (typeof data.remember !== 'undefined') {
          var remember = form.querySelector('input[type="checkbox"][name="remember"]'); if (remember) remember.checked = !!data.remember;
        }
      }
    } catch (error) {
      console.warn('Could not parse saved signin data', error);
    }

    // Handle submit: save to localStorage
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = (document.getElementById('email') || {}).value || '';
      var password = (document.getElementById('password') || {}).value || '';
      var remember = !!(form.querySelector('input[type="checkbox"][name="remember"]') || {}).checked;

      var payload = {
        email: email,
        // store password only if remember checked; otherwise remove it
        password: remember ? password : '',
        remember: remember,
        savedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem('su_signin', JSON.stringify(payload));
        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          var orig = submitBtn.textContent;
          submitBtn.textContent = 'Saved ✓';
          setTimeout(function () { submitBtn.textContent = orig; }, 1200);
        }
      } catch (error) {
        console.error('Could not save signin data', error);
      }
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