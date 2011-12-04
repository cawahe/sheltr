if (typeof SH === 'undefined' || !SH) {
  var SH = {};
}

(function($) {
  SH.map = function () {
    var map,
        infoWindow = new google.maps.InfoWindow(),
        geocoder = new google.maps.Geocoder(),
        youMarkerCollection = new Array(),
        needMarkerCollection = new Array(),
        userLocation,
        _self;

    var markerShadow = new google.maps.MarkerImage('/img/marker_shadow.png',
      new google.maps.Size(51.0, 37.0),
      new google.maps.Point(16, 16),
      new google.maps.Point(0, 22));

    _self = {
      create: function (options) {
        var settings = {
              mapId: 'map',
              zoom: 14,
              center: new google.maps.LatLng(39.95240, -75.16362),
              mapTypeId: google.maps.MapTypeId.ROADMAP
            };

        if (options) {
          $.extend(settings, options);
        }
        map = new google.maps.Map(document.getElementById(settings.mapId), settings);
      },

      getShelters: function (userLocation) {

        var lat = parseFloat(userLocation.lat());
        var lng = parseFloat(userLocation.lng());

        $.ajax({
        url: '_map?lat=' + lat + '&long=' + lng,
        context: document.body,
        success: function(data){
           _self.addShelters(data);
          }
        });

      },

      addShelters: function (shelters) {
        var i,
            lat,
            lng,
            latlng,
            sheltersLength = shelters.result.length;

        _self.removeMarkers(needMarkerCollection);

        for (i=0; i<sheltersLength; i++) {
          lat = shelters.result[i].Latitude;
          lng = shelters.result[i].Longitude;
          latlng = new google.maps.LatLng(lat, lng);
          
          _self.createMarker(latlng, shelters.result[i].Name, {icon: '/img/shelter.png', shadow: markerShadow});
        }
      },

      createMarker: function (latlng, description, options) {
        var settings = {
              position: latlng,
              map: map,
          };

        if (options) {
          $.extend(settings, options);
        }

        var marker = new google.maps.Marker(settings);

        google.maps.event.addListener(marker, 'click', function() {
          infoWindow.close();
          infoWindow.setContent(description);
          infoWindow.open(map,marker);
        });
        
        if (description === 'Your Location') { //TODO: this is fragile.
          google.maps.event.addListener(marker, 'dragend', function () {
            //recalc distance to needs when marker is dragged
          });
          
           _self.removeMarkers(youMarkerCollection)
          youMarkerCollection.push(marker); 
        } else {
          needMarkerCollection.push(marker);
        }
      },

      orientUser: function () {
        //var userLocation = null;

        // Try W3C Geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            _self.create({ center: userLocation });
            _self.getShelters(userLocation);
            _self.createMarker(userLocation, 'Your Location', {
              animation: google.maps.Animation.DROP,
              draggable: true,
              icon: '/img/you.png',
              shadow: markerShadow
            });
          }, function() {
            _self.create();
          });
        }

        return userLocation;
      },

      updateMapCenter: function (latLongObj) {
        map.setCenter(latLongObj);
      },

      geocode: function (addr, description) {
        var lat,
            lng,
            latlng;

        geocoder.geocode({
          'address': addr,
        }, function (results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            _self.createMarker(results[0].geometry.location, 'Your Location',  {
              animation: google.maps.Animation.DROP,
              draggable: true,
              icon: '/img/you.png',
              shadow: markerShadow
            });
          }
        });
      },

      removeMarkers: function(markerArray) {
        if (markerArray) {
          for (i in markerArray) {
            markerArray[i].setMap(null);
          }
          markerArray.length = 0;
        }
      }

    };

    return _self;
  };
})(jQuery);
