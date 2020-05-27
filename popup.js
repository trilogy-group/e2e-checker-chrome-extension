
document.addEventListener('DOMContentLoaded', function() {
    var checkPageButton = document.getElementById('checkPage');
    var storageFetchButton = document.getElementById('past-fetch');
    var switchButtons = document.getElementsByClassName('switches');
    
    storageFetchButton.addEventListener('click', function() {
      chrome.tabs.getSelected(null, function(tab) {
          let url = tab.url;
          let ticketKey = url.substring(url.lastIndexOf('/') + 1)
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
        let url = tab.url;
        let ticketKey = url.substring(url.lastIndexOf('/') + 1)

      let storage=localStorage.getItem(ticketKey);
      if(storage){
          storage = JSON.parse(storage)
          $("#past-fetch").show();
          let date = new Date(storage["date"])
          date= date.toLocaleString()
          $("#check-info").html(`Stored last validation for <b>${ticketKey}</b> on <b>${date}</b>`)
      }
    });

    for(var i = 0; i < switchButtons.length; i++) {
        var switchButton = switchButtons[i];
        
        switchButton.addEventListener('click', function(obj){
            console.log(obj)
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
        let url = tab.url;
        let ticketKey = url.substring(url.lastIndexOf('/') + 1)
        $("#check-info").html(`fetching validation for <b>${ticketKey}</b> ....`)
        let validationURL = "http://private.central-eks.aureacentral.com/pca-qe/api/review/"+ticketKey
        

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {

                var resp = JSON.parse(xhr.responseText);
                console.log(resp)
                RenderData(resp)
                let now = new Date()
                let date= now.toLocaleString()
                let storage = {resp:resp,date:now};
                localStorage.setItem(ticketKey, JSON.stringify(storage));
                
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
        xhr.timeout = 60000; // Set timeout to 60 seconds (60000 milliseconds)
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
    
    $("#defaultOpen").html(`Fail (${fails.length})`);
    $("#passButton").html(`Pass (${passes.length})`);


    $("#failResponse").html(getHTMLFromArray(fails, "fail"))
    $("#passResponse").html(getHTMLFromArray(passes, "pass"))

    if(fails.length>0){
        $("#defaultOpen").click();
    }
    else{
        $("#passButton").click();
    }
   console.log($(".show-me-desc"))
    $(".show-me-desc").click(function(){
      var innerHTML = this.parentNode.innerText;
      let text= innerHTML.substring(innerHTML.indexOf("/")+1, innerHTML.indexOf("--")-2).trim()
      let scenario = innerHTML.split("/")[0]
      let searchText={text:text,scenario:scenario}
      console.log(searchText)
      
      const params = {
        active: true,
        currentWindow: true
      }
      chrome.tabs.query(params,(tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, searchText);
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
          if(assertion.description.indexOf("/") > -1 && assertion.description.indexOf("--") >-1 && type === "fail"){
            showMe=`<button class="show-me-desc">show me</button>`;
          }
            html= html + `<div class="tab-content">${escapeHtml(assertion.description)} ${showMe}</div>`;
        }
        html= html + "</div>";
    }
    return html
  }

  const getPassAndFails = function (data){
    let passes=[]
    let fails=[]  
    let results = data["result"];
      for (let result of results){
          category = 1;
          let title = result["check"]
          let assertions = result["assertions"]
          let pass_assertions = []
          let fail_assertions = []
          for (let assertion of assertions){
            if(assertion["result"]=="FAIL"){
                fail_assertions.push(assertion)
            }
            else{
                pass_assertions.push(assertion)
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
      }
      console.log(fails)
      console.log(passes)
      return {passes:passes, fails:fails}
  }



  function escapeHtml(str) {
    str = str.replace(/</g, "##-open-##").replace(/>/g, "##-close-##");
    return str.replace(/##-open-##/g, " <b>").replace(/##-close-##/g, "</b> ");
}