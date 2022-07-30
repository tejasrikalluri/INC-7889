let client;

init();

async function init() {
  client = await app.initialized();
  client.events.on('app.activated', renderText);
}

async function renderText() {
  const iparamData = await client.iparams.get();
  const ticketData = await client.data.get('ticket');
  const { types, array } = iparamData;
  const { ticket: { type, custom_fields: { cf_customer } } } = ticketData;
  let initial = cf_customer;
  let typeMatch = types.indexOf(type);
  console.log(type, cf_customer, typeMatch)
  console.log("**************************************")
  console.log(types)
  let eventCallback = async function (event) {
    console.log("Update properies happened")
    const ticketData = await client.data.get('ticket');
    const { ticket: { custom_fields: { cf_customer } } } = ticketData;
    const { ticket: { id } } = ticketData;
    console.log(cf_customer, initial, typeMatch)
    if (cf_customer !== initial && cf_customer && typeMatch > -1) {
      fetchNPS2Fields(cf_customer, array, id);
    }
    event.helper.done();
    event.helper.fail('errorMessage');
  };
  client.events.on("ticket.propertiesUpdated", eventCallback);
}
let fetchNPS2Fields = async function (cf_customer, array, id) {
  var headers = {
    'X-IBM-Client-Id': '<%= iparam.clientId %>',
    'X-IBM-Client-Secret': '<%= iparam.clientSecret %>',
    'HondaHeaderType.SiteId': 'FreshDesk',
    'HondaHeaderType.BusinessId': 'Part',
  };
  var options = { headers: headers };
  [err, data] = await to(client.request.get(`https://api.eu-de.apiconnect.ibmcloud.com/honda-motor-europe/tst/v100/freshdesk/part/${cf_customer}`, options));
  console.log(data);
  if (data) {
    const { PART_Information: { Part_type, Supplier, Ageing_code, Function_code, P_O_type, MPCD, Active_Not_active } } = JSON.parse(data.response);
    updateFDFields(Part_type, Supplier, Ageing_code, Function_code, P_O_type, MPCD, Active_Not_active, array, id);
  } else if (err) {
    showNotify('danger', 'Failed to fetch NPS2 fields.');
  }

  console.log(err);
}
// utility fn to avoid excessive try..catchs
function to(promise, improved) {
  return promise
    .then((data) => {
      return [null, data];
    })
    .catch((err) => {
      if (improved) {
        Object.assign(err, improved);
      }
      return [err];
    });
}
let updateFDFields = async function (Part_Type, Supplier, Aging_Code, Function_Code, Purchase_Order_Type, Flag_MPCD, Flag_Active_Part, array, id) {
  console.log(array.Part_Type)
  var headers = {
    "Authorization": "Basic <%= encode(iparam.api_key) %>", 'Content-Type': 'application/json'
  }; let body = {
    "custom_fields":
    {
      [array.Part_Type[1]]: Part_Type,
      [array.Supplier[1]]: Supplier,
      [array.Aging_Code[1]]: Aging_Code,
      [array.Function_Code[1]]: Function_Code,
      [array.Purchase_Order_Type[1]]: Purchase_Order_Type,
      [array.Flag_MPCD[1]]: Flag_MPCD,
      [array.Flag_Active_Part[1]]: Flag_Active_Part,
    }
  };
  console.log(body);
  var options = { headers: headers, body: JSON.stringify(body) };
  [err, response] = await to(client.request.put(`https://<%= iparam.domain %>/api/v2/tickets/${id}`, options));
  console.log(err, response);
  if (response) {
    showNotify('success', 'Ticket fields updated with NPS2 values.');
  } else if (err) {
    showNotify('danger', 'Failed to update ticket fields.');
  }
}
let showNotify = function (type, message) {
  client.interface.trigger("showNotify", { type, message });
}


