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
    const { ticket: { custom_fields, id } } = ticketData;
    console.log(cf_customer, initial, typeMatch)
    if (cf_customer !== initial && typeMatch > -1) {
      fetchNPS2Fields(custom_fields, cf_customer, array, id);
    }
    event.helper.done();
    event.helper.fail('errorMessage');
  };
  client.events.on("ticket.propertiesUpdated", eventCallback);
}
let fetchNPS2Fields = async function (custom_fields, cf_customer, array, id) {
  var headers = {
    "Authorization": "Basic <%= iparam.username %>:<%= iparam.password %>",
    'X-IBM-Client-Id': 'd1707a23-b9d2-4f9a-8fbc-cf103d354f83',
    'X-IBM-Client-Secret': 'eC8vY0pA5dP6hD7sM1cV6pE7yT5uI7cG3jI1fD5gO8pB0sB2dK',
    'accept': 'application/json',
    'HondaHeaderType.CollectedTimeStamp': '2008-03-27T15:43:23.12Z',
    'HondaHeaderType.SiteId': 'FreshDesk',
    'HondaHeaderType.BusinessId': 'Part',
    'HondaHeaderType.MessageId': 'Part'
  };
  var options = { headers: headers };
  [err, response] = await to(client.request.get(`https://api.eu-de.apiconnect.ibmcloud.com/honda-motor-europe/dev/v100/freshdesk/part/${cf_customer}`, options));
  // console.log(response);
  let resp = {
    "properties": {
      "Part_Number": {
        "type": "string",
        "description": "Part Number - edited & capitals",
        "example": "15400-RBA-F01"
      },
      "Part_Type": {
        "type": "string",
        "example": "A/B/C/T/..."
      },
      "Supplier": {
        "type": "string",
        "example": "1L002"
      },
      "Aging_Code": {
        "type": "string",
        "example": "2"
      },
      "Function_Code": {
        "type": "string",
        "example": "15400"
      },
      "Purchase_Order_Type": {
        "type": "string",
        "example": "B"
      },
      "Flag_MPCD": {
        "type": "string",
        "example": "YES/NO"
      },
      "Flag_Active_Part": {
        "type": "string",
        "example": "A/I",
        "description": "Active / Inactive"
      }
    }
  };
  const { properties: { Part_Type, Supplier, Aging_Code, Function_Code, Purchase_Order_Type, Flag_MPCD, Flag_Active_Part } } = resp;
  updateFDFields(Part_Type, Supplier, Aging_Code, Function_Code, Purchase_Order_Type, Flag_MPCD, Flag_Active_Part, array, id);
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
      [array.Part_Type[1]]: Part_Type.example,
      [array.Supplier[1]]: Supplier.example,
      [array.Aging_Code[1]]: Aging_Code.example,
      [array.Function_Code[1]]: Function_Code.example,
      [array.Purchase_Order_Type[1]]: Purchase_Order_Type.example,
      [array.Flag_MPCD[1]]: Flag_MPCD.example,
      [array.Flag_Active_Part[1]]: Flag_Active_Part.example,
    }
  };
  console.log(body);
  var options = { headers: headers, body: JSON.stringify(body) };
  [err, response] = await to(client.request.put(`https://<%= iparam.domain %>/api/v2/tickets/${id}`, options));
  console.log(err, response);
}


