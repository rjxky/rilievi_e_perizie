"use strict";

$(document).ready(function() {
    let btnLogin=$("#btnLogin").on("click",verificaEmailLogin);
    //let btnLogout=$("#btnLogout").on("click",logout).hide();
    let btnRegister=$("#btnRegister").on("click",verificaEmailRegister);
    let loginForm=$("#loginForm").show();
    let registerForm=$("#registerForm").hide();
    let cantLogin=true;
    /*btnRegister.on("click",function(){
        window.location.href = "./pages/register/register.html"
    });*/
    let txtEmail=$("#txtEmail");
    let txtEmailRegister=$("#txtEmailRegister");
    let txtPassword=$("#txtPassword");

    $("#btnOpenRegister").on("click",function(){
        loginForm.hide();
        registerForm.show();
    });

    $("#btnOpenLogin").on("click",function(){
        loginForm.show();
        registerForm.hide();
    });


    function verificaEmailLogin(){
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
            let request = inviaRichiesta("POST", "https://marcarino-rilievi-e-perizie.herokuapp.com/api/cercaMail/", {"email":txtEmail.val()});
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
                    notifica("Email inesistente!");
                }
            });
        }
    }

    function verificaEmailRegister(){
        if (txtEmailRegister.val() == "") {
            openSnackbar("Inserire l'email!"); 
            showValidate(txtEmailRegister);
        }
        else {
            let request = inviaRichiesta("POST", "https://marcarino-rilievi-e-perizie.herokuapp.com/api/cercaMail/", {"email":txtEmailRegister.val()});
            request.fail(errore);

            request.done(function(data)
            {
                console.log(data);
                if(data["email"]=="found")
                {
                    notifica("Email già esistente!");
                }
                else if(data["email"]=="not found")
                {
                    register();
                }
            });
        }
    }

    function controllaLogin(){
        cantLogin=true;
        let request = inviaRichiesta("POST", "https://marcarino-rilievi-e-perizie.herokuapp.com/api/login",
        {
            "email":txtEmail.val(),
            "password":txtPassword.val()
        });

        request.fail(function(jqXHR, testStatus, strError)
        {
            errore(jqXHR, testStatus, strError);
            cantLogin=false;
        });
        request.done(function(data)
        {
            localStorage.setItem("user", JSON.stringify(data));
            window.location.replace("index.html");
        });
    }

    function register(){
        let request = inviaRichiesta("POST", "https://marcarino-rilievi-e-perizie.herokuapp.com/api/register",
        {
            "email":txtEmailRegister.val()
        });

        request.fail(function(jqXHR, testStatus, strError)
        {
            errore(jqXHR, testStatus, strError);
        });
        request.done(function(data)
        {
            console.log(data);
            registeredUser();
        });
    }

    function registeredUser(){
        notifica("Registrazione effettuata!");
        loginForm.show();
        registerForm.hide();
    }

    function notifica(msg){
        navigator.notification.alert(
            msg,
            function() {},
            "Info",       // Titolo finestra
            "Ok"          // pulsante di chiusura
        );
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