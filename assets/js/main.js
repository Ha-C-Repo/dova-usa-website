/* D.O.V.A., LLC - site script v2 */

document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open') ? 'true' : 'false');
    });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (links.classList.contains('open')) links.classList.remove('open');
      });
    });
  }

  // ROI calculator
  var calcInputs = document.querySelectorAll('.roi-card input[type="number"]');
  if (calcInputs.length) {
    calcInputs.forEach(function (i) { i.addEventListener('input', recalcRoi); });
    recalcRoi();
  }
  function recalcRoi() {
    var team = parseFloat((document.getElementById('roi-team') || {}).value) || 0;
    var vpd = parseFloat((document.getElementById('roi-vpd') || {}).value) || 0;
    var rate = parseFloat((document.getElementById('roi-rate') || {}).value) || 0;
    var minSavedPerDay = team * vpd * 18;
    var hoursSavedPerDay = minSavedPerDay / 60;
    var monthlySavings = hoursSavedPerDay * 22 * rate;
    var monthlyEl = document.getElementById('roi-monthly');
    var hoursEl = document.getElementById('roi-hours');
    if (monthlyEl) monthlyEl.innerHTML = '$<span class="hi">' + Math.round(monthlySavings).toLocaleString() + '</span>';
    if (hoursEl) hoursEl.textContent = (Math.round(hoursSavedPerDay * 10) / 10).toLocaleString() + ' hours / day saved';
  }

  // Contact form fallback (Formspree wired in action; this only fires if action is empty)
  var form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      if (!form.action || form.action.indexOf('formspree.io') === -1) {
        e.preventDefault();
        var status = document.getElementById('form-status');
        if (status) {
          status.style.display = 'block';
          status.style.color = '#1A7FE8';
          status.textContent = 'Form not yet wired. Email info@dovausa.com directly - we will respond within one business day.';
        }
      }
    });
  }
});
