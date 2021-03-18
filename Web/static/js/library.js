"use strict";

function openSnackbar(msg) {
    // Get the snackbar DIV
    let _snackbar = $("#snackbar").html(msg);
  
    // Add the "show" class to DIV
    _snackbar.attr("class","snackbar show");
  
    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){_snackbar.attr("class", "snackbar"); }, 3000);
}

function inviaRichiesta(method, url, parameters = {}) {
    let contentType;
    if (method.toUpperCase() == "GET")
    {
        contentType = "application/x-www-form-urlencoded; charset=UTF-8"
    }
    else
    {
        contentType = "application/json; charset=UTF-8"
        parameters = JSON.stringify(parameters);
    }

    return $.ajax({
        url: url, //default: currentPage
        type: method,
        data: parameters,
        contentType: contentType,
        dataType: "json",
        timeout: 5000
    });
}


function errore(jqXHR, testStatus, strError) {
    if (jqXHR.status == 0)
    {
        openSnackbar("Connection refused or Server timeout");
    }
    else if(jqXHR.status == 403)
    {
        openSnackbar("Errore durante il login!");
    }
    else if (jqXHR.status == 200)
    {
        openSnackbar("Data format uncorrect: " + jqXHR.responseText);
    }
    else
    {
        openSnackbar("Server Error: " + jqXHR.status + " - " + jqXHR.responseText);
    }
}