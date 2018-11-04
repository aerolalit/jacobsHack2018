// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const rp = require('request-promise-native')
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add('I am your travel assistant. How can I help you?');
     agent.add(new Card({
         title: 'Travel Assistant',
         imageUrl: 'https://preview.ibb.co/h8D4V0/newlogo.png',
             
         text: `I am here to help you to find and book flights! 💁`,
        //  buttonText: 'This is a button',
        //  buttonUrl: 'https://assistant.google.com/'
      }));
  }
  
  
    function flight(agent) {
    const city = agent.parameters['geo-city'];
    const time = agent.parameters['time'];
    const gotCity = city.length > 0;
    const gotTime = time.length > 0;

    if(gotCity && gotTime) {
        agent.add(`Nice, you want to fly to ${city} at ${time}.`);
    } else if (gotCity && !gotTime) {
        agent.add('Let me know which time you want to fly');
    } else if (gotTime && !gotCity) {
        agent.add('Let me know which city you want to fly to');
    } else {
        agent.add('Let me know which city and time you want to fly');
    }
  }

 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
}

function paypal(agent){
    agent.add('Alright. then please complete the payment.')
    console.log()
      agent.add(new Card({
         title: `Book your flight now!`,
         imageUrl: 'https://www.barkhofen-tiernahrung.de/wp-content/uploads/2014/07/PayPal-logo-300x300.jpg',
             
         text: `You will be redirected to paypal`,
         buttonText: 'PayNow',
         buttonUrl: 'https://www.paypal.com/signin?country.x=US&locale.x=en_US'
      })
     );
       
   }

function travel_search(agent){
    // agent.add('Hello world');
    const fromCity = agent.parameters['geo-city'];
    const toCity = agent.parameters['geo-city1'];
    const date = agent.parameters['date'];
    
    // agent.add(`I am looking for flights from ${fromCity} to ${toCity} on ${date} `);
    
    const fromCityCode = getLocCode(fromCity);
    const toCityCode = getLocCode(toCity);
    // agent.add(`City codes are ${fromCityCode} and ${toCityCode}`);
    console.log(date);
    
    var url = `http://partners.api.skyscanner.net/apiservices/browsedates/v1.0/FR/eur/en-US/${fromCityCode}/${toCityCode}/2019/2019?apikey=ha665632766585375309370755882971`;
    
    const message = ['hello'];
    return rp(url)
        .then(resp => {
            // console.log(resp)
            const data = JSON.parse(resp);
            // console.log(data)
            // console.log('success');
            // message.push('success');
            // agent.add(message.join(' '));
            //  agent.add('2');
            // console.log(data);
            var minPrice = data.Quotes[0].MinPrice;
            // console.log('minfirst');
            // console.log(minPrice);
           
            var carrierId = data.Quotes[0].OutboundLeg.CarrierIds[0];
            // console.log('here', carrierId);
            for(var i=0; i < data.Quotes.length; i++){
                if ( minPrice > data.Quotes[i].MinPrice){
                    minPrice = data.Quotes[i].MinPrice;
                    carrierId = data.Quotes[i].OutboundLeg.CarrierIds[0];
                }
            }
            // var noOfQuotes = 
            agent.add(`I found ${data.Quotes.length} flights for your query. The cheapest flight from ${fromCity} to ${toCity} on ${date} costs ${minPrice} euros. `);
            
            for (i=0; i < data.Carriers.length; i++){
                if(data.Carriers[i].CarrierId === carrierId ){
                    var airlines = data.Carriers[i].Name;
                    agent.add(`The flight is  operated by ${airlines}. I have your Paypal on file. Would you like me to book this for you.`);
                    break;
                }
            }
            // agent.add(`The carrier id is  ${carrierId}`);
            
            return Promise.resolve(message);
        })
    
        .catch(function(error) {
          
          return Promise.resolve(error);
        });
        
    
}

// function get

function getLocCode(location){
   var codeTable = {
       "bremen": "bre",
       "kathmandu":"ktm",
       "hamburg":"hamb",
       "berlin":"berl"
   }
   var loc = location.toLowerCase();
   return codeTable[loc];
    
}

function test(agent){
 

    var url = 'http://partners.api.skyscanner.net/apiservices/browsedates/v1.0/FR/eur/en-US/bre/pari/2019/2019?apikey=ha665632766585375309370755882971';
    const message = ['hello'];
    return rp(url)
        .then(resp => {
            // console.log(resp)
            const data = JSON.parse(resp);
            // console.log(data)
            console.log('success');
            message.push('success');
            // agent.add(message.join(' '));
            //  agent.add('2');
            // console.log(data);
            var minPrice = data.Quotes[0].MinPrice;
            console.log('minfirst');
            console.log(minPrice);
           
            var carrierId = data.Quotes[0].OutboundLeg.CarrierIds[0];
            console.log('here', carrierId);
            for(var i=0; i < data.Quotes.length; i++){
                if ( minPrice > data.Quotes[i].MinPrice){
                    minPrice = data.Quotes[i].MinPrice;
                    carrierId = data.Quotes[i].OutboundLeg.CarrierIds[0];
                }
            }
            
            agent.add(`The min price is ${minPrice}. `);
            
            for (i=0; i < data.Carriers.length; i++){
                if(data.Carriers[i].CarrierId === carrierId ){
                    var airlines = data.Carriers[i].Name;
                    agent.add(`The flight is  operated by ${airlines} airlines`);
                }
            }
            agent.add(`The carrier id is  ${carrierId}`);
            
            return Promise.resolve(message);
        })
    
        .catch(function(error) {
          
          return Promise.resolve(error);
        });
        
}
  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs/tree/master/samples/actions-on-google
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('flight', flight);
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('travel-search',travel_search);
  intentMap.set('test', test);
  intentMap.set('flight', flight);
  intentMap.set('booking-yes', paypal);
 
  
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
