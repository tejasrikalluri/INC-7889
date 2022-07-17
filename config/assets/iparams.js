app.initialized().then(function (client) {
    window.client = client;
    $(".next_page,.NPS2_authentication").hide();
    $(document).on('click', '#authBtn', function () {
        $(this).text("Authenticating...");
        $(this).prop("disabled", true);
        (!$("#apiKey").val().trim()) ?
            showErrorMsg("apiKey", "Please enter API Key") :
            removeAttrFn("apiKey");
        ($("#domain").val().trim() === "") ? showErrorMsg("domain", "Please enter Domain") : removeAttrFn("domain");
        ($("#apiKey").val().trim() !== "" && $("#domain").val().trim() !== "") ? getTicketFileds('fd') : buttonEnable('authBtn');
    });
    $(document).on('click', '#authBtn_NPS2', NSP2BtnClick);
    $(document).on('change', '#customerID', function () {
        $("#selectError").html("");
    });
    $(document).on('fwFocus', '#domain,#apiKey,#username,#password', function () {
        removeAttrFn("domain");
        removeAttrFn("apiKey");
        removeAttrFn("username");
        removeAttrFn("password");
    });
    $('.fd_fields').on('fwChange', function () {
        console.log($(this).val())
        let optionArray1 = optionArray.filter(v => v.value !== $(this).val());
        console.log(optionArray1)
        setOption(optionArray1);
    });
});
let NSP2BtnClick = function () {
    $(this).text("Authenticating...");
    $(this).prop("disabled", true);
    $(this).prop("disabled", true);
    (!$("#username").val().trim()) ?
        showErrorMsg("username", "Please enter username") :
        removeAttrFn("username");
    ($("#password").val().trim() === "") ? showErrorMsg("password", "Please enter password") : removeAttrFn("password");
    ($("#username").val().trim() !== "" && $("#password").val().trim() !== "") ? Nps2VadalitionCheck() : buttonEnable('authBtn_NPS2');
}
let Nps2VadalitionCheck = function () {
    console.log("*********************")
    $("#authBtn_NPS2").text("Authenticated");
    $(".NPS2_authentication").hide();
    $(".next_page").show();
    getTicketFileds('nps2');
}
function removeAttrFn(id) {
    $("#" + id).removeAttr("error-text");
    $("#" + id).removeAttr("state");
}
function showErrorMsg(id, text) {
    $("#" + id).attr("error-text", text);
    $("#" + id).attr("state", "error");
}
let getFDFileds = async function () {
    let err, reply;
    var domain = $("#domain").val();
    var api_key = $("#apiKey").val();
    const URL = `https://${domain}/api/v2/ticket_fields`;
    var authOpts = {
        headers: {
            Authorization: `Basic ${btoa(api_key)}`,
            'Content-Type': 'application/json'
        }
    };
    [err, reply] = await to(client.request.get(URL, authOpts));
    if (err) {
        return ''
    };
    if (reply) {
        let { response } = reply;
        return JSON.parse(response);
    }
}
function to(promise, improved) {
    return promise
        .then((data) => [null, data])
        .catch((err) => {
            console.log(err)
            if (improved) {
                Object.assign(err, improved);
            }
            return [err, null];
        });
}
async function getTicketFileds(origin) {
    let ticketsResp = await getFDFileds();
    if (ticketsResp && ticketsResp.length) {
        console.log(ticketsResp)
        if (origin == 'fd') {
            $("#authBtn").text("Authenticated");
            $(".authentication").hide();
            $(".NPS2_authentication").show();
        } else {
            const found_names = ticketsResp.filter(v => v.name === "ticket_type");
            console.log(found_names)
            console.log(found_names[0].choices)
            let select = `<fw-select label="Ticket Type" placeholder="Freshdesk ticket type(s)" id="type" multiple required>`;
            $.each(found_names[0].choices, function (k, v) {
                select +=
                    `<fw-select-option  value="${k}">${v}</fw-select-option >")`;
            });
            $.each(ticketsResp, function (k, v) {
                if (!v.default && v.type === 'custom_text') {
                    let obj = {};
                    obj.value = v.name;
                    obj.text = v.label;
                    obj.graphicsProps = { name: 'ecommerce' };
                    optionArray.push(obj)
                }
            });
            console.log(optionArray)
            setOption(optionArray);
            // =================================
            select = `${select}</fw-select>`;
            $('#typeSelectDiv').append(select);
            if (updateConfigs !== undefined) {
                $("#customerID").val(updateConfigs.customerID);
            }
        }
    } else {
        $('.error_div').html("Something went wrong please try again later");
    }
}
let setOption = function (optionArray) {
    var methodOptionSelect = document.getElementById('fap');
    methodOptionSelect.options = optionArray;
    var methodOptionSelect = document.getElementById('sup');
    methodOptionSelect.options = optionArray;
    var methodOptionSelect = document.getElementById('pt');
    methodOptionSelect.options = optionArray;
    var methodOptionSelect = document.getElementById('ac');
    methodOptionSelect.options = optionArray;
    var methodOptionSelect = document.getElementById('fc');
    methodOptionSelect.options = optionArray;
    var methodOptionSelect = document.getElementById('pot');
    methodOptionSelect.options = optionArray;
    var methodOptionSelect = document.getElementById('fmpcd');
    methodOptionSelect.options = optionArray;
}
function buttonEnable(id) {
    $("#" + id).text("Authenticate");
    $("#" + id).prop("disabled", false);
}
function handleError(error) {
    $('.error_div').show();
    if (error.status === 400) {
        $('.error_div').html("Invalid Input entered, please verify the fields and try again.");
    } else if (error.status === 401 || error.status === 403) {
        $('.error_div').html("Invalid Credentials were given or Subscription to the service expired.");
    } else if (error.status === 404) {
        $('.error_div').html("Invalid Domain entered, please check the field and try again");
    } else if (error.status === 500) {
        $('.error_div').html("Unexpected error occurred, please try after sometime.");
    } else if (error.status === 502) {
        $('.error_div').html("Error in establishing a connection.");
    } else if (error.status === 504) {
        $('.error_div').html("Timeout error while processing the request.");
    } else {
        $('.error_div').html("Unexpected Error");
    }
}