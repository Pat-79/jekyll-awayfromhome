(function () {
  'use strict';

  var form = document.getElementById('afh-comment-form');
  if (!form) {
    return;
  }

  var formWrap = document.getElementById('afh-comment-form-wrap');
  var commentsRoot = document.getElementById('afh-comments');
  var rootFormHost = document.getElementById('afh-comment-form-host-root');
  var leaveCommentButtons = document.querySelectorAll('.afh-comments__leave-btn');
  var inlineFormHost = null;
  var workerUrl = String(form.getAttribute('data-worker') || '').trim();
  var postRef = String(form.getAttribute('data-post-ref') || '').trim();
  var postTitle = String(form.getAttribute('data-post-title') || '').trim();
  var postUrl = String(form.getAttribute('data-post-url') || '').trim();
  var dateFormatSetting = String(form.getAttribute('data-date-format') || 'long').trim().toLowerCase();
  var dateLocaleSetting = String(form.getAttribute('data-date-locale') || 'page').trim().toLowerCase();

  var msgSuccess = String(form.getAttribute('data-msg-success') || 'Thank you! Your comment is awaiting moderation.');
  var msgError = String(form.getAttribute('data-msg-error') || 'Something went wrong. Please try again.');
  var msgReplyingTo = String(form.getAttribute('data-msg-replying-to') || 'Replying to %s');

  var nameInput = form.querySelector('input[name="name"]');
  var emailInput = form.querySelector('input[name="email"]');
  var textInput = form.querySelector('textarea[name="text"]');

  var replyField = form.querySelector('input[name="reply_to"]');
  var honeypotField = form.querySelector('input[name="url"]');
  var statusBox = form.querySelector('.afh-comment-form__status');
  var submitButton = form.querySelector('button[type="submit"]');

  var replyBanner = form.querySelector('.afh-comment-form__reply-banner');
  var replyBannerName = form.querySelector('.afh-comment-form__reply-to-name');
  var cancelReplyButton = form.querySelector('.afh-comment-form__cancel-reply');

  var turnstileBox = form.querySelector('.cf-turnstile');
  var isSubmitting = false;

  function getCommentDateFormatOptions(formatName) {
    if (formatName === 'short') {
      return {
        year: '2-digit',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
    }

    if (formatName === 'medium') {
      return {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
    }

    if (formatName === 'date-only') {
      return {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
    }

    return {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    };
  }

  function resolveDateLocale() {
    if (dateLocaleSetting === 'browser') {
      return undefined;
    }

    if (dateLocaleSetting && dateLocaleSetting !== 'page') {
      return dateLocaleSetting.replace(/_/g, '-');
    }

    var htmlLang = (document.documentElement.getAttribute('lang') || '').trim();
    return htmlLang || undefined;
  }

  function localizeCommentTimes() {
    var locale = resolveDateLocale();
    var dateFormatOptions = getCommentDateFormatOptions(dateFormatSetting);

    document.querySelectorAll('.afh-comment__date[datetime]').forEach(function (timeEl) {
      var iso = String(timeEl.getAttribute('datetime') || '').trim();
      if (!iso) {
        return;
      }

      var date = new Date(iso);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      try {
        var formatted = '';
        if (dateFormatSetting === 'iso') {
          formatted = date.toISOString();
        } else {
          formatted = new Intl.DateTimeFormat(locale, dateFormatOptions).format(date);
        }

        timeEl.textContent = formatted;
      } catch (_) {
        // Keep server-rendered fallback text if Intl formatting fails.
      }
    });
  }

  function setStatus(type, message) {
    if (!statusBox) {
      return;
    }

    statusBox.hidden = false;
    statusBox.textContent = message;
    statusBox.classList.remove('is-success', 'is-error');

    if (type === 'success' || type === 'error') {
      statusBox.classList.add('is-' + type);
    }
  }

  function clearStatus() {
    if (!statusBox) {
      return;
    }

    statusBox.hidden = true;
    statusBox.textContent = '';
    statusBox.classList.remove('is-success', 'is-error');
  }

  function formatReplyingTo(name) {
    if (msgReplyingTo.indexOf('%s') !== -1) {
      return msgReplyingTo.replace('%s', name);
    }

    if (msgReplyingTo.indexOf('{name}') !== -1) {
      return msgReplyingTo.replace('{name}', name);
    }

    return msgReplyingTo + ' ' + name;
  }

  function setReplyState(replyTo, replyName) {
    if (replyField) {
      replyField.value = replyTo || '';
    }

    if (!replyBanner || !replyBannerName) {
      return;
    }

    if (replyTo) {
      if (formWrap) {
        formWrap.classList.add('is-replying');
      }
      replyBanner.hidden = false;
      replyBannerName.textContent = formatReplyingTo(replyName || '');
    } else {
      if (formWrap) {
        formWrap.classList.remove('is-replying');
      }
      replyBanner.hidden = true;
      replyBannerName.textContent = '';
    }
  }

  function focusForm(scrollTarget) {
    if (nameInput) {
      nameInput.focus({ preventScroll: true });
    }

    var target = scrollTarget || formWrap;
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function ensureInlineFormHost() {
    if (inlineFormHost) {
      return inlineFormHost;
    }

    inlineFormHost = document.createElement('div');
    inlineFormHost.className = 'afh-comment-form-host afh-comment-form-host--inline';
    return inlineFormHost;
  }

  function moveFormToHost(host) {
    if (!host || !formWrap) {
      return;
    }

    host.appendChild(formWrap);
  }

  function showFormAtHost(host) {
    var targetHost = host || rootFormHost || commentsRoot;
    if (!targetHost || !formWrap) {
      return;
    }

    moveFormToHost(targetHost);
    formWrap.hidden = false;
    focusForm(targetHost);
  }

  function placeInlineHostBelowComment(commentNode, host) {
    if (!commentNode || !host) {
      return;
    }

    var body = commentNode.querySelector('.afh-comment__body');
    if (body && body.parentNode === commentNode) {
      body.insertAdjacentElement('afterend', host);
      return;
    }

    commentNode.appendChild(host);
  }

  function resetFormState() {
    form.reset();
    setReplyState('', '');
    clearStatus();
    resetTurnstile();
  }

  function hideForm() {
    if (!formWrap) {
      return;
    }

    resetFormState();
    moveFormToHost(rootFormHost || commentsRoot);
    formWrap.hidden = true;
  }

  function ensureTurnstileScript() {
    if (!turnstileBox) {
      return;
    }

    var sitekey = String(turnstileBox.getAttribute('data-sitekey') || '').trim();
    if (!sitekey) {
      return;
    }

    if (document.querySelector('script[data-afh-turnstile]')) {
      return;
    }

    var script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-afh-turnstile', 'true');
    document.head.appendChild(script);
  }

  function getTurnstileToken() {
    var tokenField = form.querySelector('input[name="cf-turnstile-response"]');
    if (!tokenField) {
      return '';
    }

    return String(tokenField.value || '').trim();
  }

  function resetTurnstile() {
    if (!window.turnstile || typeof window.turnstile.reset !== 'function') {
      return;
    }

    try {
      window.turnstile.reset();
    } catch (_) {
      // Ignore reset errors from optional Turnstile widgets.
    }
  }

  function setSubmittingState(nextState) {
    isSubmitting = nextState;

    if (submitButton) {
      submitButton.disabled = nextState;
      submitButton.setAttribute('aria-busy', nextState ? 'true' : 'false');
    }
  }

  function normalizeFormValues() {
    if (nameInput) {
      nameInput.value = String(nameInput.value || '').trim();
    }

    if (emailInput) {
      emailInput.value = String(emailInput.value || '').trim();
    }

    if (textInput) {
      textInput.value = String(textInput.value || '').trim();
    }
  }

  function validateForm(reportErrors) {
    normalizeFormValues();

    var isValid = form.checkValidity();
    if (!isValid && reportErrors) {
      form.reportValidity();
    }

    return isValid;
  }

  document.querySelectorAll('.afh-comment__reply-btn[data-reply-to]').forEach(function (button) {
    button.addEventListener('click', function () {
      var replyTo = String(button.getAttribute('data-reply-to') || '').trim();
      var replyName = String(button.getAttribute('data-reply-name') || '').trim();
      var commentNode = button.closest('.afh-comment');
      var targetHost = rootFormHost || commentsRoot;

      if (!replyTo) {
        return;
      }

      if (commentNode) {
        targetHost = ensureInlineFormHost();
        placeInlineHostBelowComment(commentNode, targetHost);
      }

      setReplyState(replyTo, replyName);
      clearStatus();
      showFormAtHost(targetHost);
    });
  });

  leaveCommentButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var hasReplyTarget = replyField && String(replyField.value || '').trim() !== '';
      var isOpenInRoot =
        !formWrap.hidden &&
        rootFormHost &&
        formWrap.parentNode === rootFormHost &&
        !hasReplyTarget;

      if (isOpenInRoot) {
        hideForm();
        return;
      }

      setReplyState('', '');
      clearStatus();
      showFormAtHost(rootFormHost || commentsRoot);
    });
  });

  if (cancelReplyButton) {
    cancelReplyButton.addEventListener('click', function () {
      hideForm();
    });
  }

  if (emailInput) {
    emailInput.addEventListener('blur', function () {
      emailInput.value = String(emailInput.value || '').trim();
      emailInput.checkValidity();
      emailInput.reportValidity();
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!validateForm(true)) {
      return;
    }

    clearStatus();

    var name = String((nameInput || {}).value || '').trim();
    var email = String((emailInput || {}).value || '').trim();
    var text = String((textInput || {}).value || '').trim();
    var replyTo = String((replyField || {}).value || '').trim();
    var honeypot = String((honeypotField || {}).value || '').trim();
    var turnstileToken = getTurnstileToken();

    if (!workerUrl || !postRef || !name || !email || !text || !turnstileToken) {
      setStatus('error', msgError);
      return;
    }

    var payload = {
      name: name,
      email: email,
      text: text,
      post_ref: postRef,
      post_title: postTitle,
      post_url: postUrl,
      reply_to: replyTo,
      turnstile_token: turnstileToken,
      url: honeypot
    };

    setSubmittingState(true);

    fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            if (!response.ok) {
              var errorMessage = String(data.error || msgError).trim() || msgError;
              throw new Error(errorMessage);
            }

            return data;
          });
      })
      .then(function (data) {
        var successMessage = String(data.message || msgSuccess).trim() || msgSuccess;
        setStatus('success', successMessage);
        form.reset();
        setReplyState('', '');
        resetTurnstile();
      })
      .catch(function (error) {
        setStatus('error', error.message || msgError);
      })
      .finally(function () {
        setSubmittingState(false);
      });
  });

  setReplyState('', '');
  hideForm();
  ensureTurnstileScript();
  localizeCommentTimes();
})();
