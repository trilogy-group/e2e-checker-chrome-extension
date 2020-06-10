var CONFIG ={
   msgIdentifier : "hsxoe2e",
   jiraDescriptionBoxId : "descriptionmodule",
   jiraTinyMCEId: "tinymce",
   jiraTinyMCEIframeId: "mce_0_ifr",
   enVDSURLMatcher: "https://confluence.devfactory.com/",
   INTELLI_SELECTORS_KEY : "IntelliSelectors"
}
var MS ={
   FULL_SEL_LIST: {},
   CACHE_SEL_LIST: {},
   FILETERED_SEL_LIST: [],
   NEW_SELECTORS : [],
   cur_selector_active_index: -1,
   last_search_key: "",
   HELPER_DIV_VISIBLE: false
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
                  if(pureTextSearch <0 &&  (divs[i+1].innerText.replace(/\n/g, " ").replace(/"/g,"").replace(/ /g,"").replace(/ /g,"").indexOf(pureText)) > -1){
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
      toSearchInDiv = document.getElementById(CONFIG.jiraDescriptionBoxId)
      if(toSearchInDiv){
         envDS = toSearchInDiv.querySelector(`a[href^='${CONFIG.enVDSURLMatcher}']`)
      }
      if(!envDS){
         // Try seraching in iframe
         if(document.querySelector('iframe')){
            toSearchInDiv = document.querySelector('iframe').contentWindow.document.getElementById(CONFIG.jiraTinyMCEId)
            if(toSearchInDiv){
               envDS = toSearchInDiv.querySelector(`a[href^='${CONFIG.enVDSURLMatcher}']`)
            }
         } 
      }
      if(envDS){
         response(envDS.href)
         return
      }
      else{
         console.log("envDS not found")
         response(null)
      }
   }

   else if(message.hasOwnProperty("magicSelectors")){
      MS.CACHE_SEL_LIST = MS.FULL_SEL_LIST = message["magicSelectors"];
      populateSelectorInfoDiv()
      showBottomDiv()
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
         if(!MS.HELPER_DIV_VISIBLE || e.type == "keyup"){
            return
         }  
         e.preventDefault();
         e.stopPropagation();
         msArrowDown()
       }
       else if(e.keyCode==38){// arrowUp
         if(!MS.HELPER_DIV_VISIBLE || e.type == "keyup"){
            return
         }
           e.preventDefault();
           e.stopPropagation();
           msArrowUp()
       }
       else if(e.keyCode==27){
           HideHelperDiv();
       }
       else if(e.keyCode==16 || e.keyCode==13){// Enter or shift
         if(!MS.HELPER_DIV_VISIBLE || e.type == "keyup"){
            return
         }
         e.preventDefault();
         e.stopPropagation();
         liOptionSelected(e, firstMatch);
         return;
       }
       else{
          if(e.type == "keyup"){
            filterSelectorOptions()
            renderFilteredSelectors()
          }
       }
   }
}


function liOptionSelected(e, match){
   let filterLen = Object.keys(MS.FILETERED_SEL_LIST).length;
   let current_index = MS.cur_selector_active_index;
   if(current_index > -1 && current_index <= filterLen){
      let position = getCaretCharacterOffsetWithin(e.target)
      let textToReplace = document.getElementById("sw-hd-ib").value
      if(current_index == filterLen ){
         MS.NEW_SELECTORS.push(textToReplace)
         populateSelectorInfoDiv()
      }else{
         let selector = MS.FILETERED_SEL_LIST[current_index]
         textToReplace = selector.name
      }
      e.target.innerHTML=e.target.innerHTML.replace(match,`"${textToReplace}"`)
      // e.target.innerHTML=e.target.innerHTML.replace(match,match.replace(".",""))
      let position_delta =textToReplace.length - match.length
      position_delta = position_delta + 3 
      setCaretPosition(e.target, position+position_delta)
   }
   HideHelperDiv();
}

function unSelectAllSelectedLI(){
   let selected = document.querySelectorAll('#filtered-selector-display-list li.selected')
   for(li of selected){
      li.classList.remove("selected")
   }
}

function msArrowDown(){
   let filterLen = Object.keys(MS.FILETERED_SEL_LIST).length;
   let current_index = MS.cur_selector_active_index;
   let new_index = current_index + 1;
   if(new_index > filterLen){
      // DO nothing
      MS.cur_selector_active_index = 0
   }
   else{
      MS.cur_selector_active_index = new_index
   }
   unSelectAllSelectedLI()
   document.getElementById("ms-filtered-selector-"+MS.cur_selector_active_index).classList.add("selected")
   let scrollTop = ( (MS.cur_selector_active_index * 26) - (410/2))
   document.getElementById("filtered-selector-display-list").scrollTop = scrollTop
}
function msArrowUp(){
   let filterLen = Object.keys(MS.FILETERED_SEL_LIST).length;
   let current_index = MS.cur_selector_active_index;
   let new_index = current_index -1;
   if(new_index < 0){
      // DO nothing
      MS.cur_selector_active_index = filterLen
   }
   else{
      MS.cur_selector_active_index = new_index
   }
   unSelectAllSelectedLI()
   document.getElementById("ms-filtered-selector-"+MS.cur_selector_active_index).classList.add("selected")
   let scrollTop = ((MS.cur_selector_active_index * 26) - (410/2))
   document.getElementById("filtered-selector-display-list").scrollTop = scrollTop
}
function populateSelectorInfoDiv(){
   if(document.getElementById("ms-sel-info")){
      document.getElementById("sel-info-top").innerHTML = Object.keys(MS.FULL_SEL_LIST).length
      document.getElementById("sel-info-bottom").innerHTML = MS.NEW_SELECTORS.length
   }
}

function renderFilteredSelectors(){
   let html ="";
   let i=0;
   for (; i< MS.FILETERED_SEL_LIST.length ; i++ ){
      let selObj =MS.FILETERED_SEL_LIST[i]
      html = html + `<li id='ms-filtered-selector-${i}'>${i+1}. ${selObj.name} | <span class="ms-t-group">${selObj.group}</span></li> `
   }
   html = html + `<li id='ms-filtered-selector-${i}'>${i+1}.  --- NEW SELECTOR --- </li> `
   
   document.getElementById("filtered-selector-display-list").innerHTML = html
   document.getElementById("ms-filter-info").innerHTML = ` ${MS.FILETERED_SEL_LIST.length} / ${Object.keys(MS.FULL_SEL_LIST).length} Matched!`
   document.getElementById("ms-filtered-selector-0").classList.add("selected")
   MS.cur_selector_active_index = 0
}

function updateFilteredSelectors(filteredSelectors){
   MS.FILETERED_SEL_LIST = filteredSelectors
}
function filterSelectorOptions(){
   let searchKey=document.getElementById("sw-hd-ib").value
   searchKey = searchKey.toLowerCase().replace(/ /g, "").replace(/-/g, "");
   // Optimize the search if the seach key was already there in the last search
   // Use the cache selector list.
   if(searchKey.indexOf(MS.last_search_key) < 0){
      MS.CACHE_SEL_LIST = MS.FULL_SEL_LIST
   }
   let keys=Object.keys(MS.CACHE_SEL_LIST)
   let newkeys = keys.filter(key => key.indexOf(searchKey)>-1)
   let filteredSelectorOptions =[];
   for (key of newkeys){
      filteredSelectorOptions.push(MS.CACHE_SEL_LIST[key])
   }
   MS.last_search_key = searchKey
   updateFilteredSelectors(filteredSelectorOptions)
}
function showHelperDiv(searchText){
   document.getElementById("sw-hd").style.display="block"
   document.getElementById("sw-fade").style.display="block"
   if(searchText){
       document.getElementById("sw-hd-ib").value = searchText;
   }else{
       document.getElementById("sw-hd-ib").value = "";
   }
   MS.HELPER_DIV_VISIBLE = true;
}

function HideHelperDiv(){
   document.getElementById("sw-hd").style.display="none"
   document.getElementById("sw-fade").style.display="none"
   MS.HELPER_DIV_VISIBLE = false;
}

function renderSelInfoDiv(){
   var helper_div = document.createElement("div");
  let selinfoContent = `
   <div id="ms-sel-info">
   <p>
      <span id="sel-info-top"></span> IntelliSelectors Loaded  <button id="msis-bottom-closebtn" style="float: right;">X</button><br>
      <span id="sel-info-bottom"></span> New Selectors (<span id="ms-sel-copy">Copy</span>)
   </p>
 </div>`
 helper_div.innerHTML=selinfoContent;
 document.body.appendChild(helper_div);  
console.log("rendered selinfo")

}
function render(){
var helper_div = document.createElement("div");
  let helper_div_content=`
  <div style='display:none' id='sw-fade'></div>
   <div style='display:none' id='sw-hd'>
      <div id='sw-hd-id'>
         <input id='sw-hd-ib' type='text' />  <span id="ms-filter-info"></span>
      </div>
      <div id="ms-usage-info">
         <p>
         Use <span class="keyboard-keys">&nbsp;↑ </span>&nbsp;up / <span class="keyboard-keys">&nbsp;↓ </span>&nbsp;down keys to navigate
         &nbsp;&amp; <span class="keyboard-keys">&nbsp;⇧&nbsp;</span> shift key to select
         </p>
      </div>
      <div>
         <ul id="filtered-selector-display-list">
         </ul>
      </div>
 </div>
 `;
  helper_div.innerHTML=helper_div_content;
   document.body.appendChild(helper_div);
   console.log("rendered Main helper div")
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
   var range = document.querySelector('iframe').contentWindow.document.createRange();
   var sel = document.querySelector('iframe').contentWindow.getSelection();

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
   if(document.querySelector('iframe') && Object.keys(MS.FULL_SEL_LIST).length > 0){
       document.querySelector('iframe').contentWindow.document.addEventListener("keydown",onJiraDescriptiopnKeyPress)
       document.querySelector('iframe').contentWindow.document.addEventListener("keyup",onJiraDescriptiopnKeyPress)     
       render();
       document.getElementById("sw-fade").addEventListener("click", HideHelperDiv);
       clearInterval(myVar);
   }
}, 2000);

const pageLoadInitialRender = () =>{
   renderSelInfoDiv();
   populateSelectorInfoDiv();
   document.getElementById("ms-sel-copy").addEventListener("click",copyNewSelectorToClipboard) 
   document.getElementById("msis-bottom-closebtn").addEventListener("click",hideBottomDiv) 
}
const hideBottomDiv = () =>{
   document.getElementById("ms-sel-info").style.display="none"
}

const showBottomDiv = () =>{
   document.getElementById("ms-sel-info").style.display="block"
}
const copyNewSelectorToClipboard = () => {
   if(MS.NEW_SELECTORS.length<1){
      return;
   }
   let str = MS.NEW_SELECTORS[0];
   for(let i=1; i<MS.NEW_SELECTORS.length; i++){
      str = str + ":\n"+MS.NEW_SELECTORS[i]
   }
   str= str+":"
   copyToClipboard(str)
   document.getElementById("ms-sel-copy").innerHTML = "Copied!"
}

const copyToClipboard = str => {
   const el = document.createElement('textarea');
   el.value = str;
   el.setAttribute('readonly', '');
   el.style.position = 'absolute';
   el.style.left = '-9999px';
   document.body.appendChild(el);
   el.select();
   document.execCommand('copy');
   document.body.removeChild(el);
 };


 pageLoadInitialRender()