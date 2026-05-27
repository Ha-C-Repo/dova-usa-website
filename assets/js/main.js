/* D.O.V.A., LLC — site script */

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      var expanded = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () {
      if (links && links.classList.contains('open')) {
        links.classList.remove('open');
      }
    });
  });

  // ROI calculator
  var calcInputs = document.querySelectorAll('.roi-calc input[type="number"]');
  if (calcInputs.length) {
    calcInputs.forEach(function (i) {
      i.addEventListener('input', recalcRoi);
    });
    recalcRoi();
  }

  function recalcRoi() {
    var team = parseFloat(document.getElementById('roi-team-size').value) || 0;
    var vehiclesPerPerson = parseFloat(document.getElementById('roi-vehicles-per-day').value) || 0;
    var rate = parseFloat(document.getElementById('roi-rate').value) || 0;
    // 18 minutes wasted per vehicle access event; eliminated by DOVA
    var minutesSavedPerDay = team * vehiclesPerPerson * 18;
    var hoursSavedPerDay = minutesSavedPerDay / 60;
    var workdaysPerMonth = 22;
    var monthlySavings = hoursSavedPerDay * workdaysPerMonth * rate;
    var monthlyEl = document.getElementById('roi-monthly');
    var hoursEl = document.getElementById('roi-hours');
    if (monthlyEl) {
      monthlyEl.textContent = '$' + Math.round(monthlySavings).toLocaleString();
    }
    if (hoursEl) {
      hoursEl.textContent = (Math.round(hoursSavedPerDay * 10) / 10).toLocaleString() + ' hours / day saved';
    }
  }

  // Contact form (Formspree-ready; Joseph swaps the action URL)
  var form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      // If no Formspree action URL is configured, prevent default and show a fallback message
      if (!form.action || form.action.indexOf('formspree.io') === -1) {
        e.preventDefault();
        var status = document.getElementById('form-status');
        if (status) {
          status.style.display = 'block';
          status.style.color = '#2E6FDB';
          status.textContent = 'Form not yet wired. Email matthew@dovausa.com directly — we will respond within one business day.';
        }
      }
    });
  }
});
