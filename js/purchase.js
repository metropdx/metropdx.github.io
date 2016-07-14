;(function ($, braintree, Card) {
  'use strict'

  // Load Client Token
  $.ajax({
    url: 'https://tl4hta2txd.execute-api.us-west-2.amazonaws.com/dev/token',
    type: 'GET',
    crossDomain: true
  }).done(function (clientToken) {
    console.log('got token', clientToken)

    // Setup Braintree client using token, attaches listener to form submit
    braintree.setup(clientToken.token, 'custom', {
      id: 'payment-form',
      enableCORS: true,
      onPaymentMethodReceived: function (obj) {
        console.log('payment received', obj)
        // Send payment nonce with additional transaction data
        var data = getFormData()
        console.log('formData', data)
        $.ajax({
          url: 'https://tl4hta2txd.execute-api.us-west-2.amazonaws.com/dev/checkout',
          type: 'POST',
          contentType: 'application/json; charset=UTF-8',
          data: {
            nonce: obj.nonce,
            purpose: data.purpose,
            payor: data.payor,
            team: data.team,
            reason: data.reason,
            amount: data.amount,
            email: data.email,
            phone: data.phone
          },
          crossDomain: true
        }).done(function (result) {
          console.log('sent checkout', result)
          if (result.status !== 200) {
            console.log('not 200')
          }
        })
      },
      onReady: function (result) {
        console.log('ready', result)
      },
      onError: function (err) {
        console.log('onError', err)
        console.dir(err)
      }
    })
  }).fail(function (xhr, status) {
    console.log('fail')
  })

  $(document).ready(function () {
    $('.popup-with-form').magnificPopup({
      type: 'inline',
      preloader: false,
      focus: '#frmPayor',

      // When elemened is focused, some mobile browsers in some cases zoom in
      // It looks not nice, so we disable it:
      callbacks: {
        beforeOpen: function () {
          if ($(window).width() < 700) {
            this.st.focus = false
          } else {
            this.st.focus = '#frmPayor'
          }
          $('#panel1').show()
          $('#panel2').hide()
        }
      }
    })

    $('.popup-with-iframe').magnificPopup({
      type: 'iframe',
      iframe: {
        markup: '<div class="mfp-iframe-scaler your-special-css-class">' +
          '<div class="mfp-close"></div>' +
          '<iframe class="mfp-iframe" frameborder="0" allowfullscreen>Loading...</iframe>' +
          '</div>'
      }
    })
    var card = new Card({
      form: '#payment-form',
      container: '.card-wrapper',
      formSelectors: {
        numberInput: 'input#frmCCNum',
        expiryInput: 'input#frmCCExp',
        cvcInput: 'input#frmCCCVC',
        nameInput: 'input#frmCCName'
      }
    })
    console.log(card)
  })

  function checkValidity (inputs) {
    for (var i = 0, len = inputs.length; i < len; i++) {
      if (!inputs[i].checkValidity()) {
        return false
      }
    }
    return true
  }

  $('#btnNext').click(function () {
    var $form = $('#payment-form')
    var $inputs = $('#frmTeam, #frmFee, #frmReason')
    if (checkValidity($inputs)) {
      $('#panel1').hide()
      $('#panel2').show()
      $('#frmCCName, #frmCCNum, #frmCCExp, #frmCCCVC, #frmCCZip').attr('required', 'required')
    } else {
      // If the form is invalid, submit it. The form won't actually submit;
      // this will just cause the browser to display the native HTML5 error messages.
      $form.find(':submit').click()
    }
  })

  $('input[type=radio][name=purposeRadios]').on('change', function () {
    displayFormFields(this)
  })
  displayFormFields($('input[type=radio][name=purposeRadios]:checked'))

  $('#frmFee').on('blur', function () {
    $('#btnPay').html('Send $' + $('#frmFee').val().trim() + ' Payment')
  })

  function displayFormFields (radios) {
    $('#lblTeam, #lblFee, #lblReason').hide()
    $('#frmTeam, #frmFee, #frmReason').hide()
    $('#frmTeam, #frmFee, #frmReason').removeAttr('required')
    $('#frmCCName, #frmCCNum, #frmCCExp, #frmCCCVC, #frmCCZip').removeAttr('required')
    if (!radios) return
    var el = $(radios)
    $('#frmFee').val(el.data('amount'))
    $('#btnPay').html('Send $' + el.data('amount') + ' Payment')
    console.log(el.data('amount'), el.data())
    switch (el.val()) {
      case 'full':
        $('#lblTeam, #frmTeam').show()
        $('#frmTeam').attr('required', 'required')
        break
      case 'deposit':
        $('#lblTeam, #frmTeam').show()
        $('#frmTeam').attr('required', 'required')
        break
      case 'partial':
        $('#lblTeam, #frmTeam, #lblFee, #frmFee').show()
        $('#frmTeam, #frmFee').attr('required', 'required')
        break
      case 'other':
        $('#lblReason, #frmReason, #lblFee, #frmFee').show()
        $('#frmReason, #frmFee').attr('required', 'required')
        break
    }
  }

  function getFormData () {
    return {
      purpose: $('input[type=radio][name=purposeRadios]:checked').val(),
      payor: $('#frmPayor').val().trim(),
      team: $('#frmTeam').val().trim(),
      reason: $('#frmReason').val().trim(),
      amount: $('#frmFee').val().trim(),
      email: $('#frmEmail').val().trim(),
      phone: $('#frmPhone').val().trim(),

      name: $('#frmCCName').val().trim(),
      number: $('#frmCCNum').val().trim(),
      expiry: $('#frmCCExp').val().trim(),
      cvc: $('#frmCCCVC').val().trim(),
      zip: $('#frmCCZip').val().trim()
    }
  }
})(jQuery, braintree, Card)
