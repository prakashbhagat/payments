$(document).ready(function(){
        (function(e){
                var payment_failed = false;

                var options = {
                        "key": "{{ api_key }}",
                        "amount": cint({{ amount }} * 100), // 2000 paise = INR 20
                        "currency": "{{ currency }}",
                        "name": "{{ title }}",
                        "description": "{{ description }}",
                        "subscription_id": "{{ subscription_id }}",
                        {% if order_id and order_id.startswith("order_") %}"order_id": "{{ order_id }}",{% endif %}
                        "handler": function (response){
                                razorpay.make_payment_log(response, options, "{{ reference_doctype }}", "{{ reference_docname }}", "{{ token }}");
                        },
                        "modal": {
                                "ondismiss": function(){
                                        // popup closed without a successful payment
                                        if (payment_failed) {
                                                window.location.href = "/payment-failed";
                                        } else {
                                                window.location.href = "/payment-cancel";
                                        }
                                }
                        },
                        "prefill": {
                                "name": "{{ payer_name }}",
                                "email": "{{ payer_email }}"
                        },
                        "notes": {{ frappe.form_dict|json }}
                };

                var rzp = new Razorpay(options);
                rzp.on("payment.failed", function (response){
                        payment_failed = true;
                        console.log(response.error);
                });
                rzp.open();
                //      e.preventDefault();
        })();
})

frappe.provide('razorpay');

razorpay.make_payment_log = function(response, options, doctype, docname, token){
        $('.razorpay-loading').addClass('hidden');
        $('.razorpay-confirming').removeClass('hidden');

        frappe.call({
                method:"payments.templates.pages.razorpay_checkout.make_payment",
                freeze:true,
                headers: {"X-Requested-With": "XMLHttpRequest"},
                args: {
                        "razorpay_payment_id": response.razorpay_payment_id,
                        "options": options,
                        "reference_doctype": doctype,
                        "reference_docname": docname,
                        "token": token
                },
                callback: function(r){
                        if (r.message && r.message.status == 200) {
                                window.location.href = r.message.redirect_to
                        }
                        else if (r.message && ([401,400,500].indexOf(r.message.status) > -1)) {
                                window.location.href = r.message.redirect_to
                        }
                }
        })
}
