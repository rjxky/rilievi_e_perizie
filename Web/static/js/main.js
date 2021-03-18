"use strict";


$(document).ready(function() {
    let btnLogin=$("#btnLogin").on("click",verificaEmail);
    let btnLogout=$("#btnLogout").on("click",logout);
    //let btnLogout=$("#btnLogout").on("click",logout).hide();
    let btnRegister=$("#btnRegister");
    let loginForm=$("#loginForm");
    let admin=true;
    let cantLogin=true;
    /*btnRegister.on("click",function(){
        window.location.href = "./pages/register/register.html"
    });*/
    let txtEmail=$("#txtEmail");
    let txtPassword=$("#txtPassword");

    function verificaEmail(){
        if (txtEmail.val() == "" && txtPassword.val() == "") {
            openSnackbar("Inserire l'email e la password!");
            showValidate(txtEmail); 
            showValidate(txtPassword);
        } 	
        else if (txtEmail.val() == "") {
            openSnackbar("Inserire l'email!"); 
            showValidate(txtEmail);
        } 
        else if (txtPassword.val() == "") {
            openSnackbar("Inserire la password!"); 
            showValidate(txtPassword);
        }
        else {
            let request = inviaRichiesta("POST", "/api/cercaMail/", {"email":txtEmail.val()});
            request.fail(errore);

            request.done(function(data)
            {
                console.log(data);
                if(data["email"]=="found")
                {
                    controllaLogin();
                }
                else if(data["email"]=="not found")
                {
                    openSnackbar("Email inesistente!");
                }
            });
        }
    }

    function logout()
    {
        let request = inviaRichiesta("POST", "/api/logout/");
        request.fail(errore);
        request.done(function(data)
        {
            console.log(data);
            window.location.reload();
        });
    }

    function controllaLogin(){
        cantLogin=true;
        let request = inviaRichiesta("POST", "/api/login",
        {
            "email":txtEmail.val(),
            "password":txtPassword.val(),
            "admin":admin
        });

        request.fail(function(jqXHR, testStatus, strError)
        {
            errore(jqXHR, testStatus, strError);
            cantLogin=false;
        });
        request.done(function(data)
        {
            console.log(data);
            loggedUser();
        });
    }

    function loggedUser(){
        console.log("Login effettuato!");
        window.location.reload();
    }



    /*==================================================================
    [ Validate after type ]*/
    $('.validate-input .input').each(function(){
        $(this).on('blur', function(){
            if(validate(this) == false){
                showValidate(this);
            }
            else {
                $(this).parent().addClass('true-validate');
            }
        })    
    })
  
  
    /*==================================================================
    [ Validate ]*/
    var input = $('.validate-input .input');

    $('#wrapper .input').each(function(){
        $(this).focus(function(){
           hideValidate(this);
           $(this).parent().removeClass('true-validate');
        });
    });

     function validate (input) {
        if($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
            if($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                return false;
            }
        }
        else {
            if($(input).val().trim() == ''){
                return false;
            }
        }
    }

    function showValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('alert-validate');

        $(thisAlert).append('<span class="btn-hide-validate">&#xf135;</span>')
        $('.btn-hide-validate').each(function(){
            $(this).on('click',function(){
               hideValidate(this);
            });
        });
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();
        $(thisAlert).removeClass('alert-validate');
        $(thisAlert).find('.btn-hide-validate').remove();
    }

});