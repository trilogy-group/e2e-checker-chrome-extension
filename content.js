chrome.runtime.onMessage.addListener((searchText)=> {
   let text1=searchText["scenario"]
   let text2=searchText["text"]
   
   let pureScenario = text1.replace(/\n/g, " ").replace(/"/g,"").replace(/ /g,"").replace(/ /g,"");
   let pureText = text2.replace(/\n/g, " ").replace(/"/g,"").replace(/ /g,"").replace(/ /g,"");

   var divs = document.getElementsByTagName('td')
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
   });