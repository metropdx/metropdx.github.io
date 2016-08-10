;(function ($, braintree, Formatter) {
  'use strict'

  loadClientToken(setupBraintreeClientV3, clientTokenLoadFailure)

  // function setupBraintreeClient (clientToken) {
  //   console.log('braintree token', clientToken)
  //   // var colorTransition = 'color 160ms linear'
  //   // Setup Braintree client using token, attaches listener to form submit
  //   braintree.setup(clientToken.token, 'custom', {
  //     id: 'payment-form',
  //     enableCORS: true,
  //     hostedFields: {
  //       styles: {
  //         'input': {
  //           'font-size': '16px',
  //           'font-family': 'courier, monospace',
  //           'font-weight': 'lighter',
  //           'color': '#ccc'
  //         },
  //         ':focus': {
  //           'color': 'black'
  //         },
  //         '.valid': {
  //           'color': '#8bdda8'
  //         }
  //       },
  //       // styles: {
  //       //   // Style all elements
  //       //   'input': {
  //       //     'width': '100%',
  //       //     'font-size': '16px',
  //       //     'color': '#3A3A3A',
  //       //     'transition': colorTransition,
  //       //     '-webkit-transition': colorTransition
  //       //   },
  //       //   // Styling a specific field
  //       //   '.number': {
  //       //     'font-family': 'monospace'
  //       //   },
  //       //   // Styling element state
  //       //   ':focus': {
  //       //     'color': 'blue'
  //       //   },
  //       //   '.valid': {
  //       //     'color': 'green'
  //       //   },
  //       //   '.invalid': {
  //       //     'color': 'red'
  //       //   },
  //       //   // Media queries
  //       //   // Note that these apply to the iframe, not the root window.
  //       //   '@media screen and (max-width: 700px)': {
  //       //     'input': {
  //       //       'font-size': '14px'
  //       //     }
  //       //   }
  //       // },
  //       // onFieldEvent: function (event) {
  //       //   if (event.type === 'focus') {
  //       //     // Handle focus
  //       //     console.log('focused')
  //       //   } else if (event.type === 'blur') {
  //       //     // Handle blur
  //       //     console.log('blured')
  //       //   } else if (event.type === 'fieldStateChange') {
  //       //     // Handle a change in validation or card type
  //       //     console.log(event.isValid) // true|false
  //       //     if (event.card) {
  //       //       console.log(event.card.type, event.card)
  //       //       // visa|master-card|american-express|diners-club|discover|jcb|unionpay|maestro
  //       //     }
  //       //   }
  //       // },
  //       number: {
  //         selector: '#frmCCNum',
  //         placeholder: '4111 1111 1111 1111'
  //       },
  //       expirationDate: {
  //         selector: '#frmCCExp',
  //         placeholder: 'MM/YY'
  //       },
  //       cvv: {
  //         selector: '#frmCCCVC',
  //         placeholder: '111'
  //       },
  //       postalCode: {
  //         selector: '#frmCCZip',
  //         placeholder: '11111'
  //       }
  //     },
  //     onPaymentMethodReceived: braintreePaymentMethodReceived,
  //     onReady: braintreeClientReady,
  //     onError: braintreeClientFailure
  //   })
  // }

  function handleError (err) {
    console.error(err)
    $('#errorMessage').html(err.message)
    showPanel('#panelError')
  };

  function handleFail () {
    showPanel('#panelFail')
  };

  function setupBraintreeClientV3 (clientToken) {
    console.log('setting up client', clientToken)
    if (!clientToken.token) {
      console.error('Error connecting to payment provider', clientToken)
      return handleFail()
    }
    braintree.client.create({
      authorization: clientToken.token
      // enableCORS: true
    }, setupHostedFieldsV3)
  }

  function setupHostedFieldsV3 (err, clientInstance) {
    if (err) {
      console.error('Error creating payment client', err)
      return handleFail()
    }
    braintree.hostedFields.create({
      client: clientInstance,
      styles: {
        'input': {
          'font-size': '14px',
          'font-family': 'courier, monospace',
          'color': '#3a3a3a'
        },
        ':focus': {
          'color': 'black'
        },
        '.valid': {
          'color': '#8bdda8'
        },
        '.invalid': {
          'color': 'tomato'
        }
      },
      fields: {
        number: {
          selector: '#frmCCNum',
          placeholder: '4111 1111 1111 1111'
        },
        cvv: {
          selector: '#frmCCCVC',
          placeholder: '123'
        },
        expirationDate: {
          selector: '#frmCCExp',
          placeholder: 'MM/YY'
        },
        postalCode: {
          selector: '#frmCCZip',
          placeholder: '90210'
        }
      }
    }, onHostedFieldsReady)
  }

  function onHostedFieldsReady (err, hostedFieldsInstance) {
    if (err) {
      console.error('Error creating hosted fields', err)
      return handleFail()
    }

    hostedFieldsInstance.on('validityChange', function (event) {
      var field = event.fields[event.emittedBy]

      if (field.isValid) {
        // Apply styling for a valid field
        $(field.container).addClass('braintree-hosted-fields-valid')
        // if (event.emittedBy === 'number') {
        //   $('#card-number').next('span').text('')
        // }
      } else if (field.isPotentiallyValid) {
        // Remove styling from potentially valid fields
        $(field.container).removeClass('braintree-hosted-fields-valid')
        $(field.container).removeClass('braintree-hosted-fields-invalid')
        // if (event.emittedBy === 'number') {
        //   $('#card-number').next('span').text('')
        // }
      } else {
        // Add styling to invalid fields
        $(field.container).addClass('braintree-hosted-fields-invalid')
        // Add helper text for an invalid card number
        // if (event.emittedBy === 'number') {
        //   $('#frmCCNum').next('span').text('Looks like this card number has an error.')
        // }
      }
    })

    hostedFieldsInstance.on('cardTypeChange', function (event) {
      // Handle a field's change, such as a change in validity or credit card type
      // if (event.cards.length === 1) {
      //   $('#card-type').text(event.cards[0].niceType)
      // } else {
      //   $('#card-type').text('Card')
      // }
    })

    onBraintreeReady(hostedFieldsInstance)
  }

  function onBraintreeReady (hostedFieldsInstance) {
    $(document).ready(function () {
      $('input').on('focus', function (e) {
        var div = $(e.target).parent()
        div.removeClass('braintree-hosted-fields-valid')
        div.removeClass('braintree-hosted-fields-invalid')
        div.addClass('braintree-hosted-fields-focused')
      }).on('blur', function (e) {
        var div = $(e.target).parent()
        div.removeClass('braintree-hosted-fields-focused')
        div.removeClass('braintree-hosted-fields-valid')
        div.removeClass('braintree-hosted-fields-invalid')
        if (e.target.checkValidity()) {
          div.addClass('braintree-hosted-fields-valid')
        } else {
          div.addClass('braintree-hosted-fields-invalid')
        }
      })

      var formatterPhone = new Formatter(document.getElementById('frmPhone'), {
        'pattern': '({{999}}) {{999}}-{{9999}}'
      })

      $('button').click(setupClickHander(hostedFieldsInstance))

      $('#frmFee').on('blur', function () {
        $('#btnPay').html('Send $' + $('#frmFee').val().trim() + ' Payment')
        $('#feeDisplay').html('$' + $('#frmFee').val().trim())
      })

      showPanel('#panel1')

      // $('.panel-body').submit(function (event) {
      //   event.preventDefault()
      //   hostedFieldsInstance.tokenize(function (err, payload) {
      //     if (err) {
      //       console.error(err)
      //       return
      //     }
      //
      //     // This is where you would submit payload.nonce to your server
      //     console.log('Submit your nonce to your server here!')
      //   })
      // })
    })
  }

  // function braintreePaymentMethodReceived (obj) {
  //   console.log('payment method received', obj)
  //
  //   // Get data from form
  //   var data = $.extend(getFormData(), { nonce: obj.nonce })
  //   // Send payment nonce with additional form data
  //   sendPaymentForm(data, function (result) {
  //     console.log('sent payment form', result)
  //     if (result.status !== 200) {
  //       console.log('not 200')
  //     }
  //     checkout.teardown(function () {
  //       checkout = null
  //       // createHostedFields()
  //     })
  //   })
  // }

  // function braintreeClientReady (integration) {
  //   console.log('braintree ready', integration)
  //   checkout = integration
  //
  //   $(document).ready(function () {
  //     setupPaymentPopup('.popup-with-form', '#frmPayor', function () {
  //       // Show the first panel in payment form
  //       // $('#panel1').show()
  //       // $('#panel2').hide()
  //
  //       $('#panel2').show()
  //       $('#panel1').hide()
  //     })
  //     setupRegistrationPopup('.popup-with-iframe')
  //     // var card = new Card(cardSettings)
  //     // console.log(card)
  //
  //     $('button').click(onButtonClicked)
  //
  //     // $('input[type=radio][name=purposeRadios]').on('change', function () {
  //     //   displayFormFields(this)
  //     // })
  //     // displayFormFields($('input[type=radio][name=purposeRadios]:checked'))
  //
  //     $('#frmFee').on('blur', function () {
  //       $('#btnPay').html('Send $' + $('#frmFee').val().trim() + ' Payment')
  //     })
  //   })
  // }

  // function braintreeClientFailure (err) {
  //   console.log('braintree client setup error', err)
  //   console.dir(err)
  // }

  function sendPaymentForm (data, onDone, onFail) {
    $.ajax({
      url: 'https://tl4hta2txd.execute-api.us-west-2.amazonaws.com/dev/checkout',
      type: 'POST',
      contentType: 'application/json; charset=UTF-8',
      data: {
        nonce: data.nonce,
        merchant: data.merchant,
        purpose: data.purpose,
        payor: data.payor,
        team: data.team,
        reason: data.reason,
        amount: data.amount,
        email: data.email,
        phone: data.phone,
        name: data.name
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
    handleFail()
  }

  function updateReason (reason, amount) {
    $('#frmPurpose').val(reason)
    $('#frmFee').val(amount)
    $('#btnPay').html('Send $' + amount + ' Payment')
    $('#feeDisplay').html('$' + amount)
  }

  function displayFields (props) {
    $('#lblTeam, #lblFee, #lblReason').hide()
    $('#wrapTeam, #wrapFee, #wrapReason').hide()
    $('#frmTeam, #frmFee, #frmReason, #frmCCName').removeAttr('required')
    $(props.show).show()
    $(props.required).attr('required', 'required')
  }

  function setupClickHander (hostedFieldsInstance) {
    return function onButtonClicked (event) {
      var id = event.target.id
      var amount = $(event.target).data('amount')
      var panel = $(event.target).data('panel')
      console.log("here")
      switch (id) {
        case 'btnTeam':
          updateReason('team', amount)
          displayFields({
            show: '#lblTeam, #wrapTeam',
            required: '#frmTeam'
          })
          break
        case 'btnDeposit':
          updateReason('deposit', amount)
          displayFields({
            show: '#lblTeam, #wrapTeam',
            required: '#frmTeam'
          })
          break
        case 'btnPlayer':
          updateReason('player', amount)
          displayFields({
            show: '#lblReason, #wrapReason',
            required: '#frmReason'
          })
          break
        case 'btnPartial':
          updateReason('partial', amount)
          displayFields({
            show: '#lblTeam, #wrapTeam, #lblFee, #wrapFee',
            required: '#frmTeam, #frmFee'
          })
          break
        case 'btnOther':
          updateReason('other', amount)
          displayFields({
            show: '#lblReason, #wrapReason, #lblFee, #wrapFee',
            required: '#frmReason, #frmFee'
          })
          break
        case 'btnNext':
          if (onClickNext()) {
            $('#frmCCName').attr('required', 'required')
          } else {
            panel = null
          }
          break
        case 'btnPay':
          event.preventDefault()
          // Deactivate submit button
          $(event.target).prop('disabled', true)

          hostedFieldsInstance.tokenize(function (err, obj) {
            if (err) {
              return handleError(err)
            }

            console.log('payment method received', obj)

            // amount: transaction.amount,
            // createdAt: transaction.createdAt,
            // id: transaction.id,
            // descriptor: transaction.descriptor.name,
            // cardType: transaction.creditCard.cardType,
            // maskedNumber: transaction.creditCard.maskedNumber,
            // errors: []

            // Get data from form
            var data = $.extend(getFormData(), { nonce: obj.nonce })
            // console.log('sending data', data)
            // Send payment nonce with additional form data
            sendPaymentForm(data, function (result) {
              // console.log('sent payment form', result)
              $('#feeDisplay').html('$' + result.amount)
              $('#cardTypeDisplay').html(result.cardType)
              $('#last4Display').html(result.last4)
              $('#descriptorDisplay').html(result.descriptor)
              $('#transactionIdDisplay').html(result.id)
              showPanel('#panel4')
            }, function (err) {
              // Activate submit button
              $(event.target).prop('disabled', false)
              return handleError(err)
            })
          })
          break
        case 'btnBack1':
        case 'btnBack2':
        case 'btnRetry':
          break
        case 'btnCancel':
        case 'btnDone':
          window.location.replace('/')
          break
        default:
          // Shouldn't happen, error out
      }
      if (panel) {
        showPanel(panel)
      }
    }
  }

  function showPanel (panel) {
    $('#panel0, #panel1, #panel2, #panel3, #panel4, #panelError, #panelFail').removeClass('hidden').hide()
    $(panel).show()
  }

  function onClickNext () {
    // var $form = $('#payment-form')
    var $inputs = $('#frmPayor, #frmTeam, #frmFee, #frmReason, #frmEmail, #frmPhone')
    if (checkValidity($inputs)) {
      $('#frmCCName, #frmCCNum, #frmCCExp, #frmCCCVC, #frmCCZip').attr('required', 'required')
      return true
    } else {
      // If the form is invalid, submit it. The form won't actually submit
      // this will just cause the browser to display the native HTML5 error messages.
      // $form.find(':submit').click()
      return false
    }
  }

  function checkValidity (inputs) {
    var result = true
    for (var i = 0, len = inputs.length; i < len; i++) {
      var div = $(inputs[i]).parent()
      if (!inputs[i].checkValidity()) {
        div.addClass('braintree-hosted-fields-invalid')
        result = false
      } else {
        div.addClass('braintree-hosted-fields-valid')
      }
    }
    return result
  }

  function getFormData () {
    return {
      merchant: $('#frmMerchant').val().trim(),
      // purpose: $('input[type=radio][name=purposeRadios]:checked').val(),
      purpose: $('#frmPurpose').val().trim(),
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
})(jQuery, braintree, Formatter)
