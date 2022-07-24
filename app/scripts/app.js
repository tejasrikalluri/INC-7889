let client;

init();

async function init() {
  client = await app.initialized();
  client.events.on('app.activated', renderText);
}

async function renderText() {
  const iparamData = await client.iparams.get();
  console.log(iparamData)
  const { types } = iparamData;
  console.log("**************************************")
  console.log(types)
  client.events.on("ticket.propertiesUpdated", eventCallback, { intercept: true });
}
let eventCallback = function (event) {
  console.log(event.type + " event occurred");
  var event_data = event.helper.getData();
  console.log(event_data)
  event.helper.done()
  event.helper.fail('errorMessage')
};
