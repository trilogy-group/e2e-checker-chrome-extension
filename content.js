chrome.runtime.onMessage.addListener((searchText)=> {
   let text1=searchText["scenario"]
   let text2=searchText["text"]
   debugger;
   var divs = document.getElementsByTagName('td')
   for (var i = 0; i < divs.length; i++) {
      divs[i].style.backgroundColor = "white";  
      var index1 = divs[i].innerText.indexOf(text1);
      var index2 = divs[i].innerText.indexOf(text2)
      if (index1 != -1) {
               //elem.scrollIntoView()
                divs[i].scrollIntoView()
                divs[i].style.backgroundColor = "yellow";
      }
   }
   });