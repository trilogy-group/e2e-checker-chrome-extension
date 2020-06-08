CONFIG={
  msgIdentifier : "hsxoe2e",
  ticketValidatorEndPoint: "http://private.central-eks.aureacentral.com/pca-qe/api/review/",
  envDSValidatorEndPoint: "http://private.central-eks.aureacentral.com/pca-qe/api/ticketservice/envDs/yaml",
  EnvStatus : {
    ENV_NOT_FOUND_LOAD : "No environemnt Found on Page. Click to load Intelliselectors",
    ENV_FOUND_LOAD : "An Environemnt was found on Page. Click to load Intelliselectors",
    LOADING_SELECTORS : "Loading Selectors",
    SELECTORS_LOADED: "IntelliSelectors Activated from"
  },
  enVDSURLMatcher: "https://confluence.devfactory.com/",
  INTELLI_SELECTORS_KEY : "IntelliSelectors",
  timeout: 60000
}
var CURRENT_INTELLI_SELECTORS_LIST = null


const sendMagicSelectorsToContent =(selectors) =>{
  chrome.tabs.query({active: true,currentWindow: true},(tabs) => {
    let message={}
    message[CONFIG.msgIdentifier] = {magicSelectors:selectors};
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
}

const loadIntelliSelectors = (url, topText, bottomText) => {
  let obj = getFromLocalStorage(url)
  let magicselectors=parseSelectors(obj["resp"])
  let no__of_selectors = Object.keys(magicselectors).length
  let date = obj["date"]
  let storage_selectors={url:url, date: date,  selectors: magicselectors}
  localStorage.setItem(CONFIG.INTELLI_SELECTORS_KEY, JSON.stringify(storage_selectors))
  CURRENT_INTELLI_SELECTORS_LIST = magicselectors
  
  sendMagicSelectorsToContent(magicselectors)

  // Show Status
  let path = url.replace(CONFIG.enVDSURLMatcher, "")
  $("#env-status-show").html(`(${no__of_selectors}) ${topText} <br> ${path} <br> ${date} <br>${bottomText}`)
}

const renderEnvDS = envds => {

  console.log(envds)
  let path = null

  if(envds && getFromLocalStorage(envds) ){
    loadIntelliSelectors(envds, "Intelliselectors for environment loaded from", "Click to load recent one")   
    $("#env-url-input").val(envds)
    
  }else if(envds && !getFromLocalStorage(envds)){
    $("#env-url-input").val(envds)
    localStorage.removeItem(CONFIG.INTELLI_SELECTORS_KEY);
    path = envds.replace(CONFIG.enVDSURLMatcher, "")
    $("#env-status-show").html(`${CONFIG.EnvStatus.ENV_FOUND_LOAD} <br> ${path}`)
  }
  else if (!envds){
    let storedIntelliSelectors = getFromLocalStorage(CONFIG.INTELLI_SELECTORS_KEY)
    if(storedIntelliSelectors){
      let url = storedIntelliSelectors.url
      loadIntelliSelectors(url,`IntelliSelectors loaded. But No EnvDS found on Page`,"")
    }else{
    $("#env-status-show").html(`${CONFIG.EnvStatus.ENV_NOT_FOUND_LOAD}`)
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true,currentWindow: true},(tabs) => {
    let message={}
    message[CONFIG.msgIdentifier] = {returnEnvDS:""};
    chrome.tabs.sendMessage(tabs[0].id, message, renderEnvDS);
  });

  $("#envFooter").click(function(){
    $("#env-show-hide").toggle();
  });

  let loadENVButton = document.getElementById('load-env-button');
  var checkPageButton = document.getElementById('checkPage');
  var storageFetchButton = document.getElementById('past-fetch');
  var switchButtons = document.getElementsByClassName('switches');
  
  
  loadENVButton.addEventListener('click', function() {    
      chrome.tabs.getSelected(null, function(tab) {
        let url =document.getElementById("env-url-input").value;
        if(!url || url.length < 1){
          url = tab.url;
        }
        let getENVURL = CONFIG.envDSValidatorEndPoint+`?url=${url}`
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
              try{
                console.log("ENV loading call completed successfully status 200")
                let nativeObject = YAML.parse(xhr.responseText)
                let date =  new Date().toLocaleString()
                addTOLocalSTorage("env",url,{date: date, resp:nativeObject})
                loadIntelliSelectors(url, CONFIG.EnvStatus.SELECTORS_LOADED, "")
                $("#env-show-hide").hide()
              }catch(e){
                alert("Exception in fetching envDS")
                $("#env-status-show").html("Exception in fetching envDS")
                console.error(e)
              }
                
            }
            if( xhr.status > 299 && xhr.readyState == 4) {
              console.log('Server Error: ' + xhr.statusText);
              $("#env-status-show").html(`Exception in fetching envDS status ${xhr.status}`)
          }
        }
        xhr.open("GET", getENVURL, true);
        xhr.timeout = CONFIG.timeout; // Set timeout to 60 seconds (60000 milliseconds)
        xhr.ontimeout = function () { 
                    console.log('Request Timed out 60 secs');
                    $("#env-status-show").html(`EnvDS Fetch Timedout`)
                }
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send();
        $("#env-status-show").html(`${CONFIG.EnvStatus.LOADING_SELECTORS}`)
    });
  })


    storageFetchButton.addEventListener('click', function() {
      chrome.tabs.getSelected(null, function(tab) {
          let ticketKey = getTicketKeyFromURL(tab.url)
          let storage=localStorage.getItem(ticketKey);
          if(storage){
            storage = JSON.parse(storage)
            $("#past-fetch").show();
            let resp = storage["resp"]
            RenderData(resp)
          }
          else{
            $("#check-info").html(`NO storage avaiable`)
          }
      });
    });

    chrome.tabs.getSelected(null, function(tab) {
      let ticketKey = getTicketKeyFromURL(tab.url)
      let storage=localStorage.getItem(ticketKey);
      if(storage){
          storage = JSON.parse(storage)
          $("#past-fetch").show();
          $("#past-fetch").click();
          let date = new Date(storage["date"])
          date= date.toLocaleString()
          $("#check-info").html(`Stored last validation for <b>${ticketKey}</b> on <b>${date}</b>`)
      }
    });

    for(var i = 0; i < switchButtons.length; i++) {
        var switchButton = switchButtons[i];
        
        switchButton.addEventListener('click', function(obj){
            let pageName = this.getAttribute("data-switch")
            let color = this.getAttribute("data-color")
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
              tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tablink");
            for (i = 0; i < tablinks.length; i++) {
              tablinks[i].style.backgroundColor = "";
            }
            document.getElementById(pageName).style.display = "block";
            this.style.backgroundColor = color;
        })
    }

    checkPageButton.addEventListener('click', function() {

      chrome.tabs.getSelected(null, function(tab) {
        let ticketKey = getTicketKeyFromURL(tab.url)
        $("#check-info").html(`fetching validation for <b>${ticketKey}</b> ....`)
        let validationURL = CONFIG.ticketValidatorEndPoint+ticketKey
        

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
              console.log("Ticket validator call completed successfully status 200")
                var resp = JSON.parse(xhr.responseText);
                RenderData(resp)
                let now = new Date()
                let date= now.toLocaleString()
                let storage = {resp:resp,date:now};
                addTOLocalSTorage("e2e",ticketKey, storage);                
                document.getElementById("loader-div").classList.remove("loading")
                $("#check-info").html(`fetched validation for <b>${ticketKey}</b> on <b>${date}</b>`)
                
            }
            if( xhr.status > 299 && xhr.readyState == 4) {
              console.log('Server Error: ' + xhr.statusText);
              document.getElementById("loader-div").classList.remove("loading")
              $("#check-info").html(`API Failed with status ${xhr.status}. Check VPN or server is down.`)
          }
        }
        xhr.open("GET", validationURL, true);
        xhr.timeout = CONFIG.timeout; // Set timeout to 60 seconds (60000 milliseconds)
        xhr.ontimeout = function () { 
                    console.log('Request Timed out 60 secs');
                    document.getElementById("loader-div").classList.remove("loading")
                    $("#check-info").html(`Request Timed out 60 secs. Check VPN or server is down.`)
                }
        xhr.send();
        document.getElementById("loader-div").classList.add("loading")
        
      });
    }, false);
  }, false);

  const RenderData = function (data){
    let response = getPassAndFails(data)
    let passes = response["passes"]
    let fails = response["fails"]
    let others = response["others"]
    
    $("#defaultOpen").html(`Fail (${fails.length})`);
    $("#passButton").html(`Pass (${passes.length})`);
    $("#otherButton").html(`Other (${others.length})`);


    $("#failResponse").html(getHTMLFromArray(fails, "fail"))
    $("#passResponse").html(getHTMLFromArray(passes, "pass"))
    $("#otherResponse").html(getHTMLFromArray(others, "other"))

    if(fails.length>0){
        $("#defaultOpen").click();
    }
    else{
        $("#passButton").click();
    }
    $(".show-me-desc").click(function(){
      var innerHTML = this.parentNode.innerText;
      let text= innerHTML.substring(innerHTML.indexOf("/")+1, innerHTML.indexOf("--")-1).trim()
      let scenario = innerHTML.split("/")[0]
      let searchText={text:text,scenario:scenario}
      let message={hsxoe2e:searchText}
      console.log(message) 
      const params = {
        active: true,
        currentWindow: true
      }
      chrome.tabs.query(params,(tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message);
    }); 
    })
  }


  const getHTMLFromArray= function(data, type){
    let html='';
    if(data.length==0){
        return `<div class="tab">
                <input type="checkbox" id="chck1">
                <label class="tab-label" for="chck1">No ${type}</label>
                </div`;
    }
    for (let i=0; i<data.length;i++){
        let object= data[i]
        html = html + `<div class="tab"> <input type="checkbox" id="chck-${type}-${i}">`;
        html= html + ` <label class="tab-label" for="chck-${type}-${i}">${object.title} (${object.assertions.length})</label>`;
        for (let assertion of object.assertions){
          let showMe=""
          let showType=""
            if(type== "other"){
              showType = assertion.result
            }
          if(assertion.description.indexOf("/") > -1 && assertion.description.indexOf("--") >-1 && type === "fail"){
            showMe=`<button class="show-me-desc">show me</button>`;
          }
            html= html + `<div class="tab-content">${escapeHtml(assertion.description)} (${showType}) ${showMe}</div>`;
        }
        html= html + "</div>";
    }
    return html
  }

  const getPassAndFails = function (data){
    let passes=[]
    let fails=[]  
    let others=[] 
    let results = data["result"];
      for (let result of results){
          category = 1;
          let title = result["check"]
          let assertions = result["assertions"]
          let pass_assertions = []
          let fail_assertions = []
          let other_assertions = []
          for (let assertion of assertions){
            if(assertion["result"]=="FAIL"){
                fail_assertions.push(assertion)
            }else if(assertion["result"]=="PASS"){
                pass_assertions.push(assertion)
            }else{
                other_assertions.push(assertion)
            }
          }
          
          if(fail_assertions.length > 0){
            let finalResult = {title : title, assertions : fail_assertions}
            fails.push(finalResult)
          }
          if(pass_assertions.length > 0){
            let finalResult = {title : title, assertions : pass_assertions}
            passes.push(finalResult)
          }
          if(other_assertions.length > 0){
            let finalResult = {title : title, assertions : other_assertions}
            others.push(finalResult)
          }
      }
      return {passes:passes, fails:fails, others: others}
  }



  function escapeHtml(str) {
    str = str.replace(/</g, "##-open-##").replace(/>/g, "##-close-##");
    return str.replace(/##-open-##/g, " <b>").replace(/##-close-##/g, "</b> ");
}
function getRAWURL(url){
  let nurl = url.split("?")[0]
  nurl=nurl.split("#")[0];
  return nurl
}

function addTOLocalSTorage(type, key, obj){
  localStorage.setItem(key, JSON.stringify(obj));
  let extStoredKeys=localStorage.getItem("extension-stored-keys");
  if(!extStoredKeys){
    extStoredKeys={e2e:{}, env:{}}
  }
  else{
    extStoredKeys=JSON.parse(extStoredKeys)
  }
  extStoredKeys[type][key]=new Date()
  localStorage.setItem("extension-stored-keys", JSON.stringify(extStoredKeys));
}
function getFromLocalStorage(key){
  let obj = localStorage.getItem(key)
  if(!obj || obj.length<1){
    return null
  }
  else return JSON.parse(obj)
}

function renderENV(){
  let envs= getALlENVS();
  let html = "<ul>";
  let intelliSelectors=`<button class="intelli-selectors">Load to Intelli-Selectors</button>`;
  for (var key in envs) {
    if (envs.hasOwnProperty(key)) {
        html = html + `<li> ${key} -- ${envs[key]} <br> ${intelliSelectors}</li>`
    }
  }
  html = html + "</ul>";
  $("#available-envs").html(html)
}

function getTicketKeyFromURL(url){
 let rawURL = getRAWURL(url)
 let ticketKey = rawURL.substring(rawURL.lastIndexOf('/') + 1)
 return ticketKey;
}
function parseSelectors(obj){
  let theMagicSelectorObj={}
  let selectors=obj["selectors"]
  for (group of selectors){
    let groupName = group["name"]
    let finalSelectors = group["selectors"]
    for (var key in finalSelectors) {
      if (finalSelectors.hasOwnProperty(key)) {
        let nameKey = key.toLowerCase().replace(/ /g, "").replace(/-/g, "");
        // let groupNameKey = groupName.toLowerCase().replace(/ /g, "").replace(/-/g, "");
        // let searchKey = nameKey+"|"+groupNameKey
        let searchValue={xpath:finalSelectors[key], group: groupName, name: key}
        let uniquekey = getUniqueKey(theMagicSelectorObj, nameKey)
        theMagicSelectorObj[uniquekey]=searchValue
      }
    }
  }
  return theMagicSelectorObj;
}

function getUniqueKey(obj, key){
  let ukey = key
  for(i=1; i<100; i++){
    if(obj.hasOwnProperty(ukey)){
        ukey=ukey+i
    }
    else{
      break
    }
  }
return ukey;
}