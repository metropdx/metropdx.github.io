;(function ($, braintree, Card) {
  'use strict'

  // var cardSettings = {
  //   form: '#payment-form',
  //   container: '.card-wrapper',
  //   formSelectors: {
  //     numberInput: 'input#frmCCNum',
  //     expiryInput: 'input#frmCCExp',
  //     cvcInput: 'input#frmCCCVC',
  //     nameInput: 'input#frmCCName'
  //   }
  // }
  var checkout

  loadClientToken(setupBraintreeClientV3, clientTokenLoadFailure)

  function setupBraintreeClient (clientToken) {
    console.log('braintree token', clientToken)
    // var colorTransition = 'color 160ms linear'
    // Setup Braintree client using token, attaches listener to form submit
    braintree.setup(clientToken.token, 'custom', {
      id: 'payment-form',
      enableCORS: true,
      hostedFields: {
        styles: {
          'input': {
            'font-size': '16px',
            'font-family': 'courier, monospace',
            'font-weight': 'lighter',
            'color': '#ccc'
          },
          ':focus': {
            'color': 'black'
          },
          '.valid': {
            'color': '#8bdda8'
          }
        },
        // styles: {
        //   // Style all elements
        //   'input': {
        //     'width': '100%',
        //     'font-size': '16px',
        //     'color': '#3A3A3A',
        //     'transition': colorTransition,
        //     '-webkit-transition': colorTransition
        //   },
        //   // Styling a specific field
        //   '.number': {
        //     'font-family': 'monospace'
        //   },
        //   // Styling element state
        //   ':focus': {
        //     'color': 'blue'
        //   },
        //   '.valid': {
        //     'color': 'green'
        //   },
        //   '.invalid': {
        //     'color': 'red'
        //   },
        //   // Media queries
        //   // Note that these apply to the iframe, not the root window.
        //   '@media screen and (max-width: 700px)': {
        //     'input': {
        //       'font-size': '14px'
        //     }
        //   }
        // },
        // onFieldEvent: function (event) {
        //   if (event.type === 'focus') {
        //     // Handle focus
        //     console.log('focused')
        //   } else if (event.type === 'blur') {
        //     // Handle blur
        //     console.log('blured')
        //   } else if (event.type === 'fieldStateChange') {
        //     // Handle a change in validation or card type
        //     console.log(event.isValid) // true|false
        //     if (event.card) {
        //       console.log(event.card.type, event.card)
        //       // visa|master-card|american-express|diners-club|discover|jcb|unionpay|maestro
        //     }
        //   }
        // },
        number: {
          selector: '#frmCCNum',
          placeholder: '4111 1111 1111 1111'
        },
        expirationDate: {
          selector: '#frmCCExp',
          placeholder: 'MM/YY'
        },
        cvv: {
          selector: '#frmCCCVC',
          placeholder: '111'
        },
        postalCode: {
          selector: '#frmCCZip',
          placeholder: '11111'
        }
      },
      onPaymentMethodReceived: braintreePaymentMethodReceived,
      onReady: braintreeClientReady,
      onError: braintreeClientFailure
    })
  }

  function setupBraintreeClientV3 (clientToken) {
    console.log('setting up client')
    braintree.client.create({
      authorization: clientToken.token
    }, function (err, clientInstance) {
      if (err) {
        console.error(err)
        return
      }
      console.log('got token')
      braintree.hostedFields.create({
        client: clientInstance,
        styles: {
          'input': {
            'font-size': '14px',
            'font-family': 'helvetica, tahoma, calibri, sans-serif',
            'color': '#3a3a3a'
          },
          ':focus': {
            'color': 'black'
          }
        },
        fields: {
          number: {
            selector: '#card-number',
            placeholder: '4111 1111 1111 1111'
          },
          cvv: {
            selector: '#cvv',
            placeholder: '123'
          },
          expirationMonth: {
            selector: '#expiration-month',
            placeholder: 'MM'
          },
          expirationYear: {
            selector: '#expiration-year',
            placeholder: 'YY'
          },
          postalCode: {
            selector: '#postal-code',
            placeholder: '90210'
          }
        }
      }, function (err, hostedFieldsInstance) {
        if (err) {
          console.error(err)
          return
        }

        $(document).ready(function () {
          setupPaymentPopup('.popup-with-form', '#frmPayor', function () {
            // Show the first panel in payment form
            // $('#panel1').show()
            // $('#panel2').hide()

            $('#panel2').show()
            $('#panel1').hide()
          })
          setupRegistrationPopup('.popup-with-iframe')
          // var card = new Card(cardSettings)
          // console.log(card)

          $('#btnNext').click(onNextButton)

          $('input[type=radio][name=purposeRadios]').on('change', function () {
            displayFormFields(this)
          })
          displayFormFields($('input[type=radio][name=purposeRadios]:checked'))

          $('#frmFee').on('blur', function () {
            $('#btnPay').html('Send $' + $('#frmFee').val().trim() + ' Payment')
          })
        })

        hostedFieldsInstance.on('validityChange', function (event) {
          var field = event.fields[event.emittedBy]

          if (field.isValid) {
            // Apply styling for a valid field
            $(field.container).parents('.form-group').addClass('has-success')
            if (event.emittedBy === 'number') {
              $('#card-number').next('span').text('')
            }
          } else if (field.isPotentiallyValid) {
            // Remove styling  from potentially valid fields
            $(field.container).parents('.form-group').removeClass('has-warning')
            $(field.container).parents('.form-group').removeClass('has-success')
            if (event.emittedBy === 'number') {
              $('#card-number').next('span').text('')
            }
          } else {
            // Add styling to invalid fields
            $(field.container).parents('.form-group').addClass('has-warning')
            // Add helper text for an invalid card number
            if (event.emittedBy === 'number') {
              $('#card-number').next('span').text('Looks like this card number has an error.')
            }
          }
        })

        hostedFieldsInstance.on('cardTypeChange', function (event) {
          // Handle a field's change, such as a change in validity or credit card type
          if (event.cards.length === 1) {
            $('#card-type').text(event.cards[0].niceType)
          } else {
            $('#card-type').text('Card')
          }
        })

        $('.panel-body').submit(function (event) {
          event.preventDefault()
          hostedFieldsInstance.tokenize(function (err, payload) {
            if (err) {
              console.error(err)
              return
            }

            // This is where you would submit payload.nonce to your server
            console.log('Submit your nonce to your server here!')
          })
        })
      })
    })
  }

  function braintreePaymentMethodReceived (obj) {
    console.log('payment method received', obj)

    // Get data from form
    var data = $.extend(getFormData(), { nonce: obj.nonce })
    // Send payment nonce with additional form data
    sendPaymentForm(data, function (result) {
      console.log('sent payment form', result)
      if (result.status !== 200) {
        console.log('not 200')
      }
      checkout.teardown(function () {
        checkout = null
        // createHostedFields()
      })
    })
  }

  function braintreeClientReady (integration) {
    console.log('braintree ready', integration)
    checkout = integration

    $(document).ready(function () {
      setupPaymentPopup('.popup-with-form', '#frmPayor', function () {
        // Show the first panel in payment form
        // $('#panel1').show()
        // $('#panel2').hide()

        $('#panel2').show()
        $('#panel1').hide()
      })
      setupRegistrationPopup('.popup-with-iframe')
      // var card = new Card(cardSettings)
      // console.log(card)

      $('#btnNext').click(onNextButton)

      $('input[type=radio][name=purposeRadios]').on('change', function () {
        displayFormFields(this)
      })
      displayFormFields($('input[type=radio][name=purposeRadios]:checked'))

      $('#frmFee').on('blur', function () {
        $('#btnPay').html('Send $' + $('#frmFee').val().trim() + ' Payment')
      })
    })
  }

  function braintreeClientFailure (err) {
    console.log('braintree client setup error', err)
    console.dir(err)
  }

  function sendPaymentForm (data, onDone, onFail) {
    $.ajax({
      url: 'https://tl4hta2txd.execute-api.us-west-2.amazonaws.com/dev/checkout',
      type: 'POST',
      contentType: 'application/json; charset=UTF-8',
      data: {
        nonce: data.nonce,
        purpose: data.purpose,
        payor: data.payor,
        team: data.team,
        reason: data.reason,
        amount: data.amount,
        email: data.email,
        phone: data.phone
      },
      crossDomain: true
    })
      .done(onDone)
      .fail(onFail)
  }

  function loadClientToken (onDone, onFail) {
    $.ajax({
      url: 'https://tl4hta2txd.execute-api.us-west-2.amazonaws.com/dev/token',
      type: 'GET',
      crossDomain: true
    })
      .done(onDone)
      .fail(onFail)
  }

  function clientTokenLoadFailure (xhr, status) {
    console.log('fail loading client token')
  }

  function setupRegistrationPopup (selector) {
    $(selector).magnificPopup({
      type: 'iframe',
      iframe: {
        markup: '<div class="mfp-iframe-scaler your-special-css-class">' +
          '<div class="mfp-close"></div>' +
          '<iframe class="mfp-iframe" frameborder="0" allowfullscreen>Loading...</iframe>' +
          '</div>'
      }
    })
  }

  function setupPaymentPopup (selector, focusSelector, callback) {
    $(selector).magnificPopup({
      type: 'inline',
      preloader: false,
      focus: focusSelector,
      callbacks: {
        beforeOpen: function () {
          // When elemened is focused, some mobile browsers in some cases zoom in
          // It looks not nice, so we disable it:
          if ($(window).width() < 700) {
            // cardSettings.width = 250
            this.st.focus = false
          } else {
            this.st.focus = focusSelector
          }
          callback && callback()
        }
      }
    })
  }

  function onNextButton () {
    var $form = $('#payment-form')
    var $inputs = $('#frmTeam, #frmFee, #frmReason')
    if (checkValidity($inputs)) {
      $('#panel1').hide()
      $('#panel2').show()
      $('#frmCCName, #frmCCNum, #frmCCExp, #frmCCCVC, #frmCCZip').attr('required', 'required')
    } else {
      // If the form is invalid, submit it. The form won't actually submit
      // this will just cause the browser to display the native HTML5 error messages.
      $form.find(':submit').click()
    }
  }

  function checkValidity (inputs) {
    for (var i = 0, len = inputs.length; i < len; i++) {
      if (!inputs[i].checkValidity()) {
        return false
      }
    }
    return true
  }

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
