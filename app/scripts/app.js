let client;

init();

async function init() {
  client = await app.initialized();
  client.events.on('app.activated', renderText);
}

async function renderText() {
  const iparamData = await client.iparams.get();
  const ticketData = await client.data.get('ticket');
  const { types } = iparamData;
  const { ticket: { type, custom_fields: { cf_customer } } } = ticketData;
  let typeMatch = types.indexOf(types);
  console.log(type, cf_customer, typeMatch)
  console.log("**************************************")
  console.log(types)
  let  eventCallback = async function (event) {
    console.log("Update properies happened")
    const ticketData = await client.data.get('ticket');
    const { ticket: { custom_fields: { cf_customer } } } = ticketData;
    console.log(cf_customer)
    // console.log(cf_customer)
    event.helper.done();
    event.helper.fail('errorMessage')
  };
  client.events.on("ticket.propertiesUpdated", eventCallback, { intercept: true });
}


