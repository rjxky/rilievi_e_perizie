"use strict";


$(document).ready(function() {
    let wrapper = $(".wrap-index").show();
    let _map = wrapper.children(".map")[0];
    let btnLogout=$("#btnLogout").on("click",logout);
    let btnDeletePath=$("#btnDeletePath").hide();
    let createUserForm=$("#createUserForm").hide();
    let btnCreateUser=$("#btnCreateUser");
    let txtEmailCreate=$("#txtEmailCreate");
    let btnCreate=$("#btnCreate");
    let map;
    let msg=$("#msg");
    let markerData=$("#markerData").hide();
    let txtAdminComment=$("#txtAdminComment");
    let btnPath = $("#btnPath").show();
    let markerLat;
	let markerLon;
	let markerID;
    let markerPos;
    let panel = wrapper.children(".panel")[0];
    let infoWindow;
    let adminPos;
    initMap();
	setMarkers();

    function initMap() {
		if (navigator.geolocation)
		{
			navigator.geolocation.getCurrentPosition(
				(position) => {
				
				const pos = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};
                map = new google.maps.Map(_map, {
                    center: pos,
                    zoom: 7,
                  });
				  infoWindow = new google.maps.InfoWindow();

				map.setCenter(pos);
				},
				() => {
					handleLocationError(true, infoWindow, map.getCenter());
				}
			);
		}
		else
		{
			// Browser doesn't support Geolocation
			handleLocationError(false, infoWindow, map.getCenter());
		}
	}

    btnCreateUser.on("click",function(){
        wrapper.hide();
        createUserForm.show();
    });

    btnCreate.on("click",function(){
        if (txtEmailCreate.val() == "") {
            openSnackbar("Inserire l'email!"); 
            showValidate(txtEmailCreate);
        }
        else {
            let request = inviaRichiesta("POST", "https://marcarino-rilievi-e-perizie.herokuapp.com/api/cercaMail/", {"email":txtEmailCreate.val()});
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
                    create();
                }
            });
        }
    });

    function create(){
        let request = inviaRichiesta("POST", "https://marcarino-rilievi-e-perizie.herokuapp.com/api/register",
        {
            "email":txtEmailCreate.val()
        });

        request.fail(function(jqXHR, testStatus, strError)
        {
            errore(jqXHR, testStatus, strError);
        });
        request.done(function(data)
        {
            console.log(data);
            createdUser();
        });
    }

    function createdUser(){
        createUserForm.hide();
        wrapper.show();
    }

    $("#btnComment").on("click", function(){
        let request = inviaRichiesta("POST", "/api/adminComment", {
            "id" : markerID, 
            "comment" : txtAdminComment.val()
        });

        request.fail(errore);
        request.done(function(data)
        {
            alert("The comment has been successfully sent!");
        });
	});

    btnPath.on("click", function()
	{
        markerData.hide();
		navigator.geolocation.getCurrentPosition(
			(position) => {
				panel.innerHTML = "";

				let directionsService = new google.maps.DirectionsService();
				let directionsRenderer = new google.maps.DirectionsRenderer();
				adminPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

				let mapOptions =
				{
					"center":adminPos,
					"zoom":16,
					"mapTypeId":google.maps.MapTypeId.ROADMAP
				}

				map = new google.maps.Map(_map, mapOptions);
				directionsRenderer.setMap(map);
				calculate(directionsService, directionsRenderer);
			},
			() => {
				handleLocationError(true, infoWindow, map.getCenter());
			}
		);
	});

    function calculate(directionsService, directionsRenderer) {
        let request = {
            origin: adminPos,
            destination: markerPos,
            travelMode: 'DRIVING'
        };

        directionsService.route(request, function (routes, status) 
		{
            if (status == 'OK') {
                directionsRenderer.setDirections(routes);
				directionsRenderer.setPanel(panel);
            }

            let distance = routes.routes[0].legs[0].distance.text;
            let time = routes.routes[0].legs[0].duration.text;
            msg.html(`Distance: ${distance} | Time: ${time}`);
			btnDeletePath.show();
            btnPath.hide();
        });
    }

    btnDeletePath.on("click", function(){
		window.location.reload();
	});

    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(
          browserHasGeolocation ? "Error: The Geolocation service failed." : "Error: Your browser doesn't support geolocation."
        );
        infoWindow.open(map);
    }

    function setMarkers(){
        let request = inviaRichiesta("POST", "/api/findReports");

		request.fail(errore);
		request.done(function(data)
		{
			if(data["ris"] != "err")
			{
                console.log(data["ris"]);
				for(let i = 0; i < data["ris"].length; i++)
				{
					let lat=parseFloat(data["ris"][i].coord.split("|")[0].split(":")[1]);
					let lon=parseFloat(data["ris"][i].coord.split("|")[1].split(":")[1]);

					let newMarker = new google.maps.Marker({
						position: { "lat": lat, "lng": lon },
						map,
						title: data["ris"][i].email
					});

					newMarker.addListener("click", function()
					{
                        markerData.show();
						markerLat=parseFloat(data["ris"][i].coord.split("|")[0].split(":")[1]);
						markerLon=parseFloat(data["ris"][i].coord.split("|")[1].split(":")[1]);
						markerPos=new google.maps.LatLng(markerLat, markerLon);
                        $("#img").prop("src",data["ris"][i].image)
						$("#txtEmail").val(data["ris"][i].email);
						$("#txtCoord").val(`Lat: ${markerLat} | Lng: ${markerLon}`);
						$("#txtDate").val(data["ris"][i].date);
						$("#txtUserComment").val(data["ris"][i].notes);
						$("#txtAdminComment").val(data["ris"][i].notesAdmin);
						markerID = data["ris"][i]._id;
					});
				}
			}
		});
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
});