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

  var msgSubmitSuccess = String(form.getAttribute('data-msg-submit-success') || 'Your comment has been submitted for review and approval.');
  var msgSubmitError = String(form.getAttribute('data-msg-submit-error') || 'An error occurred submitting your comment. Please try again.');
  var msgError = String(form.getAttribute('data-msg-error') || 'Something went wrong. Please try again.');
  var msgReplyingTo = String(form.getAttribute('data-msg-replying-to') || 'Replying to %s');
  var msgTurnstileChecking = String(form.getAttribute('data-msg-turnstile-checking') || 'Checking for robots . . .');
  var msgTurnstileSuccess = String(form.getAttribute('data-msg-turnstile-success') || "Human detected, you're allowed to submit a comment.");
  var msgSubmitting = String(form.getAttribute('data-msg-submitting') || 'Submitting your comment . . .');

  var nameInput = form.querySelector('input[name="name"]');
  var emailInput = form.querySelector('input[name="email"]');
  var textInput = form.querySelector('textarea[name="text"]');

  var replyField = form.querySelector('input[name="reply_to"]');
  var honeypotField = form.querySelector('input[name="url"]');
  var statusBox = form.querySelector('.afh-comment-form__status');
  var turnstileStatusText = form.querySelector('.afh-comment-form__turnstile-status-text');
  var submitButton = form.querySelector('button[type="submit"]');
  var closeSuccessButton = form.querySelector('.afh-comment-form__close-btn');

  var replyBanner = form.querySelector('.afh-comment-form__reply-banner');
  var replyBannerName = form.querySelector('.afh-comment-form__reply-to-name');
  var cancelReplyButton = form.querySelector('.afh-comment-form__cancel-reply');

  var turnstileBox = form.querySelector('.cf-turnstile');
  var hasTurnstile = !!turnstileBox;
  var isSubmitting = false;
  var isTurnstileReady = !hasTurnstile;
  var turnstileWidgetId = null;
  var turnstileScriptLoading = false;
  var submitResultMessage = '';
  var submitResultIsError = false;

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

  function setTurnstileStatus(message, isError) {
    if (!turnstileStatusText) {
      return;
    }

    turnstileStatusText.textContent = message || '';
    turnstileStatusText.classList.toggle('is-error', !!isError && !!message);
  }

  function clearSubmitResultStatus() {
    submitResultMessage = '';
    submitResultIsError = false;
  }

  function enterPostSuccessMode(message) {
    form.classList.add('is-post-success');
    if (message) {
      setStatus('success', message);
    }
    if (closeSuccessButton) {
      closeSuccessButton.hidden = false;
    }
    setTurnstileStatus('', false);
  }

  function exitPostSuccessMode() {
    form.classList.remove('is-post-success');
    if (closeSuccessButton) {
      closeSuccessButton.hidden = true;
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

  function ensureTurnstileScript() {
    if (!hasTurnstile) {
      return;
    }

    if (window.turnstile || turnstileScriptLoading || document.querySelector('script[data-afh-turnstile]')) {
      return;
    }

    turnstileScriptLoading = true;

    var script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-afh-turnstile', 'true');
    script.setAttribute('data-cfasync', 'false');
    script.addEventListener('load', function () {
      turnstileScriptLoading = false;
      renderTurnstile(true);
    });
    script.addEventListener('error', function () {
      turnstileScriptLoading = false;
      console.log('[Turnstile] script load error');
      setTurnstileStatus(msgError, true);
      setTurnstileButtonState('error');
    });
    document.head.appendChild(script);
  }

  function clearStaleTurnstileFields() {
    form.querySelectorAll('input[name="cf-turnstile-response"]').forEach(function (field) {
      if (field && field.parentNode) {
        field.parentNode.removeChild(field);
      }
    });
  }

  function getTurnstileRenderOptions() {
    if (!turnstileBox) {
      return null;
    }

    syncTurnstileTheme();

    return {
      sitekey: String(turnstileBox.getAttribute('data-sitekey') || '').trim(),
      theme: String(turnstileBox.getAttribute('data-theme') || 'auto').trim(),
      size: String(turnstileBox.getAttribute('data-size') || 'normal').trim(),
      appearance: String(turnstileBox.getAttribute('data-appearance') || 'always').trim(),
      callback: window.onTurnstileSuccess,
      'error-callback': window.onTurnstileError,
      'expired-callback': window.onTurnstileExpired,
      'refresh-timeout': String(turnstileBox.getAttribute('data-refresh-timeout') || 'auto').trim()
    };
  }

  function renderTurnstile(forceRender) {
    if (!hasTurnstile) {
      return;
    }

    clearSubmitResultStatus();
    setTurnstileStatus(msgTurnstileChecking, false);
    setTurnstileButtonState('waiting');

    if (!window.turnstile || typeof window.turnstile.render !== 'function') {
      ensureTurnstileScript();
      return;
    }

    if (forceRender && turnstileWidgetId !== null && typeof window.turnstile.remove === 'function') {
      try {
        window.turnstile.remove(turnstileWidgetId);
      } catch (_) {
        // Ignore remove errors from stale widgets.
      }
      turnstileWidgetId = null;
    }

    if (forceRender) {
      clearStaleTurnstileFields();
      turnstileBox.innerHTML = '';
    }

    if (turnstileWidgetId !== null) {
      try {
        window.turnstile.reset(turnstileWidgetId);
        return;
      } catch (_) {
        turnstileWidgetId = null;
        clearStaleTurnstileFields();
        turnstileBox.innerHTML = '';
      }
    }

    var renderOptions = getTurnstileRenderOptions();
    if (!renderOptions || !renderOptions.sitekey) {
      console.log('[Turnstile] missing render options');
      setTurnstileStatus(msgError, true);
      setTurnstileButtonState('error');
      return;
    }

    turnstileWidgetId = window.turnstile.render(turnstileBox, renderOptions);
  }

  function showFormAtHost(host) {
    var targetHost = host || rootFormHost || commentsRoot;
    if (!targetHost || !formWrap) {
      return;
    }

    moveFormToHost(targetHost);
    exitPostSuccessMode();
    clearStatus();
    formWrap.hidden = false;

    if (hasTurnstile) {
      renderTurnstile(true);
    } else {
      syncSubmitButtonState();
    }

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

    form.reset();
    setReplyState('', '');
    exitPostSuccessMode();
    clearStatus();
    clearSubmitResultStatus();
    setTurnstileStatus('', false);
    moveFormToHost(rootFormHost || commentsRoot);
    formWrap.hidden = true;
  }

  function isFormVisible() {
    return !!formWrap && !formWrap.hidden;
  }

  function isCloseModeVisible() {
    return (
      isFormVisible() &&
      !!closeSuccessButton &&
      !closeSuccessButton.hidden &&
      form.classList.contains('is-post-success')
    );
  }

  function isCancelModeVisible() {
    return (
      isFormVisible() &&
      !form.classList.contains('is-post-success') &&
      !!cancelReplyButton
    );
  }

  function canKeyboardSubmit() {
    return (
      isFormVisible() &&
      !form.classList.contains('is-post-success') &&
      !!submitButton &&
      !submitButton.disabled
    );
  }

  function handleCommentFormKeydown(event) {
    if (!event) {
      return;
    }

    var key = String(event.key || '').toLowerCase();
    if (event.ctrlKey && key === 'enter') {
      if (!canKeyboardSubmit()) {
        return;
      }

      event.preventDefault();
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit(submitButton || undefined);
      } else if (submitButton) {
        submitButton.click();
      }
      return;
    }

    if (key === 'escape' || key === 'esc') {
      if (!isFormVisible()) {
        return;
      }

      if (isCloseModeVisible() || isCancelModeVisible()) {
        event.preventDefault();
        hideForm();
      }
    }
  }

  function syncSubmitButtonState() {
    if (!submitButton) {
      return;
    }

    submitButton.disabled = isSubmitting || !isTurnstileReady;
    submitButton.setAttribute('aria-disabled', submitButton.disabled ? 'true' : 'false');
  }

  function syncTurnstileTheme() {
    if (!turnstileBox) {
      return;
    }

    var theme = String(document.documentElement.getAttribute('data-theme') || '').trim().toLowerCase();
    if (theme !== 'light' && theme !== 'dark') {
      theme = 'auto';
    }

    turnstileBox.setAttribute('data-theme', theme);
  }

  function setTurnstileButtonState(state) {
    if (!hasTurnstile) {
      isTurnstileReady = true;
      setTurnstileStatus('', false);
      syncSubmitButtonState();
      return;
    }

    var hasToken = getTurnstileToken() !== '';
    isTurnstileReady = state === 'success' && hasToken;

    if (state === 'waiting') {
      setTurnstileStatus(msgTurnstileChecking, false);
    } else if (state === 'success' && hasToken) {
      setTurnstileStatus(msgTurnstileSuccess, false);
    }

    syncSubmitButtonState();
  }

  function observeThemeChanges() {
    if (!turnstileBox || typeof window.MutationObserver !== 'function') {
      return;
    }

    var html = document.documentElement;
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].type === 'attributes' && mutations[i].attributeName === 'data-theme') {
          syncTurnstileTheme();
          resetTurnstile();
          break;
        }
      }
    });

    observer.observe(html, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  function getTurnstileToken() {
    var tokenField = form.querySelector('input[name="cf-turnstile-response"]');
    if (!tokenField) {
      return '';
    }

    return String(tokenField.value || '').trim();
  }

  function resetTurnstile() {
    if (!hasTurnstile) {
      return;
    }

    renderTurnstile(false);
  }

  function setSubmittingState(nextState) {
    isSubmitting = nextState;

    if (submitButton) {
      submitButton.setAttribute('aria-busy', nextState ? 'true' : 'false');
    }

    if (nextState) {
      clearSubmitResultStatus();
      setTurnstileStatus(msgSubmitting, false);
    } else if (submitResultMessage) {
      setTurnstileStatus(submitResultMessage, submitResultIsError);
    } else if (hasTurnstile) {
      if (isTurnstileReady && getTurnstileToken() !== '') {
        setTurnstileStatus(msgTurnstileSuccess, false);
      } else {
        setTurnstileStatus(msgTurnstileChecking, false);
      }
    } else {
      setTurnstileStatus('', false);
    }

    syncSubmitButtonState();
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

  if (closeSuccessButton) {
    closeSuccessButton.addEventListener('click', function () {
      hideForm();
    });
  }

  document.addEventListener('keydown', handleCommentFormKeydown);

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

    if (!workerUrl || !postRef || !name || !email || !text || (hasTurnstile && !turnstileToken)) {
      setStatus('error', msgSubmitError);
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
              throw new Error(String(data.error || response.statusText || 'Unknown submit error'));
            }

            return data;
          });
      })
      .then(function () {
        submitResultMessage = msgSubmitSuccess;
        submitResultIsError = false;
        form.reset();
        setReplyState('', '');
        enterPostSuccessMode(msgSubmitSuccess);
      })
      .catch(function (error) {
        console.error('[Comments] submit error', error);
        submitResultMessage = msgSubmitError;
        submitResultIsError = true;
        setStatus('error', submitResultMessage);
      })
      .finally(function () {
        setSubmittingState(false);
      });
  });

  window.onTurnstileSuccess = function (token) {
    var resolvedToken = String(token || getTurnstileToken() || '').trim();
    console.log('[Turnstile] success', resolvedToken);
    if (resolvedToken !== '') {
      setTurnstileStatus(msgTurnstileSuccess, false);
      setTurnstileButtonState('success');
    } else {
      setTurnstileStatus(msgError, true);
      setTurnstileButtonState('error');
    }
  };

  window.onTurnstileError = function (error) {
    console.log('[Turnstile] error', error || 'Unknown Turnstile error');
    setTurnstileStatus(String(error || msgError).trim() || msgError, true);
    setTurnstileButtonState('error');
  };

  window.onTurnstileExpired = function () {
    console.log('[Turnstile] timeout/expired');
    setTurnstileStatus(msgTurnstileChecking, false);
    setTurnstileButtonState('waiting');
  };

  syncTurnstileTheme();
  observeThemeChanges();
  setReplyState('', '');
  hideForm();
  setTurnstileStatus('', false);
  setTurnstileButtonState('waiting');
  localizeCommentTimes();
})();
