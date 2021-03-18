$(document).ready(function() {
    document.addEventListener('deviceready', function () { 
        let btnLogout=$("#btnLogout").on("click",logout);
        let imageDetails=$("#imageDetails");
        let btnSubmit=$("#btnSubmit").show();
        let btnPhoto=$("#btnPhoto");
        let btnGetDetails=$("#btnGetDetails");
        let txtEmail=$("#txtEmail");
        let txtCoord=$("#txtCoord");
        let txtDate=$("#txtDate");
        let txtNotes=$("#txtNotes");
        let img=$("#img");

        if(!localStorage.getItem("user"))
        {
            window.location.replace("login.html");
        }

        getUser();

        let cameraOptions = {
            "quality": 50
        };

        let gpsOptions = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        btnPhoto.on("click", function()
        {
            btnSubmit.show();
            cameraOptions.sourceType = Camera.PictureSourceType.CAMERA;
            cameraOptions.destinationType = Camera.DestinationType.DATA_URL;
            navigator.camera.getPicture(success, failed, cameraOptions);
        });

        btnGetDetails.on("click", function() {
            navigator.geolocation.getCurrentPosition(function (pos) 
            {
                txtCoord.val(`Lat: ${pos.coords.latitude} | Lon: ${pos.coords.longitude}`);
                txtDate.val((new Date).toISOString());
            }, errore, gpsOptions);
        });

        btnSubmit.on("click", function(){
            btnSubmit.prop("disabled", true);

            let richiestaSubmit=inviaRichiesta("POST", "https://marcarino-rilievi-e-perizie.herokuapp.com/api/submitDetails/", {
                "email" : txtEmail.val(),
                "coord" : txtCoord.val(),
                "date" : txtDate.val(),
                "notes" : txtNotes.val(),
                "image" : img.prop("src")
            });
            
            richiestaSubmit.fail(function(jqXHR, testStatus, strError){
                btnSubmit.prop("disabled", false);
                errore(jqXHR, testStatus, strError);
            });

            richiestaSubmit.done(function(data){
                notifica("Your request has been submitted!");
                btnSubmit.hide();
            });
        });
    
        function logout()
        {
            localStorage.removeItem("user");
            window.location.replace("login.html");
        }

        function notifica(msg){
            navigator.notification.alert(
                msg,
                function() {},
                "Info",
                "Ok"
            );
        }

        function success(image) {
            $("#img").prop("src", `data:image/jpeg;base64,${image}`);
            
            let imgRequest=inviaRichiesta("POST", "https://marcarino-rilievi-e-perizie.herokuapp.com/api/caricaImmagine/", {
                "file" : image
            });
            
            imgRequest.fail(function(jqXHR, testStatus, strError){
                btnSubmit.prop("disabled", false);
                errore(jqXHR, testStatus, strError);
            });

            imgRequest.done(function(result){
                
            });
        }

        function failed(err) {
            if (err.code) {
                notifica("Errore!");
            }
        }

        function getUser()
        {
            let user=JSON.parse(localStorage.getItem("user"));
            txtEmail.val(user.email);
        }
    });
})