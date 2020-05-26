
document.addEventListener('DOMContentLoaded', function() {
    var checkPageButton = document.getElementById('checkPage');
    var switchButtons = document.getElementsByClassName('switches');

    var x= $('.switches')
    console.log("--")
    console.log(x)
    for(var i = 0; i < switchButtons.length; i++) {
        var switchButton = switchButtons[i];
        
        switchButton.addEventListener('click', function(obj){
            debugger;
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
  
      chrome.tabs.getSelected(null, async function(tab) {
        let url = tab.url;
        let ticketKey = url.substring(url.lastIndexOf('/') + 1)
        $("#check-info").html(`fetching validation for <b>${ticketKey}</b> ....`)
        let validationURL = "http://private.central-eks.aureacentral.com/pca-qe/api/review/"+ticketKey
        

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                // JSON.parse does not evaluate the attacker's scripts.
                var resp = JSON.parse(xhr.responseText);
                console.log(resp)
                RenderData(resp)
                document.getElementById("loader-div").classList.remove("loading")
                let now = new Date()
                let date= now.toGMTString().split(",")[1]
                $("#check-info").html(`fetched validation for <b>${ticketKey}</b> on <b>${date}</b>`)
                
            }
        }
        xhr.open("GET", validationURL, true);
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
            html= html + `<div class="tab-content">${assertion.description}</div>`;
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
          for (let assertion of assertions){
            if(assertion["result"]=="FAIL"){
                category = 0
                break;
            }
          }
          let finalResult = {title : title, assertions : assertions}
          if(category == 0){
              fails.push(finalResult)
          }
          else if(category == 1){
              passes.push(finalResult)
          }
      }
      console.log(fails)
      console.log(passes)
      return {passes:passes, fails:fails}
  }