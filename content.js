var CONFIG ={
   msgIdentifier : "hsxoe2e",
   jiraDescriptionBoxId : "descriptionmodule",
   jiraTinyMCEId: "tinymce",
   jiraTinyMCEIframeId: "mce_0_ifr",
   enVDSURLMatcher: "https://confluence.devfactory.com/",
   INTELLI_SELECTORS_KEY : "IntelliSelectors"
}
var CUR_SEL_LIST=null;
var CACHE_SEL_LIST=null;
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
         if(envDS){
            response(envDS.href)
            return
         }
         else{
            console.log("envDS not found")
            response(null)
         }
      }
      else{
         console.log("envDS not found")
         response(null)
      }
   }

   else if(message.hasOwnProperty("magicSelectors")){
      CACHE_SEL_LIST = CUR_SEL_LIST = message["magicSelectors"];
   }
   });



/*Key Code
13- Enter
17 - ctrl
27 - Esc
38 - upkey
40 - downkey
9- tab
*/

const onJiraDescriptiopnKeyPress = function(e){
   console.log(e)
   console.log(e.target)
   console.log(document.getSelection());
   let content = e.target.innerHTML;
   if(e.target.id=="tinymce"){
       let regexp = /"\.[a-zA-Z1-9 ]+"/g;
       let matchAll = content.matchAll(regexp);
       let matches = Array.from(matchAll);
       if(matches.length <1){
           HideHelperDiv();
           return
       }
       let firstMatch = matches[0][0];
       let searchText = firstMatch.slice(2,-1)
       if(searchText.length<3){
           HideHelperDiv();
           return
       }
       
       showHelperDiv(searchText)
       if(e.keyCode==40){// arrowDown
           e.preventDefault();
           e.stopPropagation();
       }
       else if(e.keyCode==38){// arrowUp
           e.preventDefault();
           e.stopPropagation();
       }
       else if(e.keyCode==27){
           HideHelperDiv();
       }
       else if(e.keyCode==16 || e.keyCode==13){// Enter or shift
           e.preventDefault();
           e.stopPropagation();

           let position = getCaretCharacterOffsetWithin(e.target)
           console.log("position")
           console.log(position)
           // e.target.innerHTML=e.target.innerHTML.replace(firstMatch,'<span style="background-color: yellow">' +firstMatch.replace(".","")+'</span>')
           e.target.innerHTML=e.target.innerHTML.replace(firstMatch,firstMatch.replace(".",""))
           setCaretPosition(e.target, position)
           // setCursor(position)
           //insertNodeAtCaret("["+firstMatch.replace(".","")+"]")
           HideHelperDiv();
           return;
       }
       else{
          renderSelectorOptions()
       }
   }
}
function renderSelectorOptions(){
   let searchKey=document.getElementById("sw-hd-ib").value
   searchKey = searchKey.toLowerCase().replace(/ /g, "").replace(/-/g, "");
   let keys=Object.keys(CACHE_SEL_LIST)
   let newkeys = keys.filter(key => key.indexOf(searchKey)>-1)
   console.log(newkeys)
}
function showHelperDiv(searchText){
   document.getElementById("sw-hd").style.display="block"
   document.getElementById("sw-fade").style.display="block"
   if(searchText){
       document.getElementById("sw-hd-ib").value = searchText;
   }else{
       document.getElementById("sw-hd-ib").value = "";
   }
}

function HideHelperDiv(){
   document.getElementById("sw-hd").style.display="none"
   document.getElementById("sw-fade").style.display="none"
}

function descriptionClicked(e){
   console.log(e.target)
// document.getElementById("mce_6_ifr").addEventListener("keydown",onGoogleSearchInboxKeyPress)
}

function render(){
   var helper_div = document.createElement("p");
  helper_div_content=`
  <div style='display:none' id='sw-fade'></div>
   <div style='display:none' id='sw-hd'>
      <div id='sw-hd-id'>
         <input id='sw-hd-ib' type='text' />
      </div>
 </div>`;
  helper_div.innerHTML=helper_div_content;
     document.body.appendChild(helper_div);
       // document.addEventListener("keydown", onGoogleSearchInboxKeyPress);
       
   console.log("rendered")
}


function getCaretCharacterOffsetWithin(element) {
   var caretOffset = 0;
   var doc = element.ownerDocument || element.document;
   var win = doc.defaultView || doc.parentWindow;
   var sel;
   if (typeof win.getSelection != "undefined") {
       sel = win.getSelection();
       if (sel.rangeCount > 0) {
           var range = win.getSelection().getRangeAt(0);
           var preCaretRange = range.cloneRange();
           preCaretRange.selectNodeContents(element);
           preCaretRange.setEnd(range.endContainer, range.endOffset);
           caretOffset = preCaretRange.toString().length;
       }
   } else if ((sel = doc.selection) && sel.type != "Control") {
       var textRange = sel.createRange();
       var preCaretTextRange = doc.body.createTextRange();
       preCaretTextRange.moveToElementText(element);
       preCaretTextRange.setEndPoint("EndToEnd", textRange);
       caretOffset = preCaretTextRange.text.length;
   }
   return caretOffset;
}
function recursiveCall (node, offset){
   if(node.childNodes.length < 1 && node.length){
       if (offset <= node.length) {
           currentNode = node;
           FINAL_OFFSET = offset
           return 0
       }
       offset = offset - node.length
       return offset;
   }
   
   for (let i=0; i< node.childNodes.length;i++){
       offset = recursiveCall(node.childNodes[i], offset)
       if(offset < 1){
           return offset
       }
   }
   return offset
}
var currentNode= null ;
var FINAL_OFFSET=0
function setCaretPosition(element, offset) {
   var range = document.getElementById(CONFIG.jiraTinyMCEIframeId).contentWindow.document.createRange();
   var sel = document.getElementById(CONFIG.jiraTinyMCEIframeId).contentWindow.getSelection();

   //select appropriate node
   currentNode = null;
   FINAL_OFFSET=0;
   offset = recursiveCall(element, offset)
   
   //move caret to specified offset
   if (currentNode != null) {
       range.setStart(currentNode, FINAL_OFFSET);
       range.collapse(true);
       sel.removeAllRanges();
       sel.addRange(range);
   }
}

var myVar = setInterval(function(){
   if(document.getElementById(CONFIG.jiraTinyMCEIframeId)){
       document.getElementById(CONFIG.jiraTinyMCEIframeId).contentWindow.document.addEventListener("keyup",onJiraDescriptiopnKeyPress)     
       render();
       clearInterval(myVar);
   }
}, 2000);