var CONFIG ={
   msgIdentifier : "hsxoe2e",
   jiraDescriptionBoxId : "descriptionmodule",
   jiraTinyMCEId: "tinymce",
   enVDSURLMatcher: "https://confluence.devfactory.com/"
}

chrome.runtime.onMessage.addListener((message, sender, response)=> {
   // do not do anything if message is not from extension
   if(! message.hasOwnProperty(CONFIG.msgIdentifier)){
      return;
   }
   message = message[CONFIG.msgIdentifier]
   
   if(message.hasOwnProperty("scenario")){
      let text1=message["scenario"]
      let text2=message["text"]
      
      let pureScenario = text1.replace(/\n/g, " ").replace(/"/g,"").replace(/ /g,"").replace(/ /g,"");
      let pureText = text2.replace(/\n/g, " ").replace(/"/g,"").replace(/ /g,"").replace(/ /g,"");

      var divs = document.querySelectorAll('#descriptionmodule td')
      for (var i = 0; i < divs.length; i++) {
         divs[i].style.backgroundColor = "white";  
         var pureScenarioSearch = divs[i].innerText.replace(/\n/g, " ").replace(/"/g,"").replace(/ /g,"").replace(/ /g,"").indexOf("cenario:"+pureScenario)
         var pureTextSearch = divs[i].innerText.replace(/\n/g, " ").replace(/"/g,"").replace(/ /g,"").replace(/ /g,"").indexOf(pureText)
         if (pureScenarioSearch > -1 ) {
                  if(pureTextSearch <0 &&  divs[i+1].innerText.replace(/\n/g, " ").replace(/"/g,"").replace(/ /g,"").replace(/ /g,"").indexOf(pureText)){
                     i=i+1
                  }
                  divs[i].scrollIntoView()
                  divs[i].style.backgroundColor = "yellow";
         }
      }
   }

   else if(message.hasOwnProperty("returnEnvDS")){
      let envDS = null;
      let toSearchInDiv = null;
      if(document.getElementById(CONFIG.jiraDescriptionBoxId)){
         toSearchInDiv = document.getElementById(CONFIG.jiraDescriptionBoxId)
      }
      else if(document.getElementById(CONFIG.jiraTinyMCEId)){
         toSearchInDiv = document.getElementById(CONFIG.jiraTinyMCEId);
      }
      if(toSearchInDiv!=null){
         envDS = toSearchInDiv.querySelector(`a[href^='${CONFIG.enVDSURLMatcher}']`)
         console.log(envDS.href)
         response(envDS.href)
      }
      else{
         console.log("envDS not found")
         response(null)
      }
   }
   });