//Just for the Demo,  clear out the access token and stuff
window.localStorage.removeItem('ag-oauth2-1038594593085.apps.googleusercontent.com');


var pipeline, filesPipe, authWindow, timer, authURL, callback,
    authz = AeroGear.Authorization();

authz.add({
    name: "drive",
    settings: {
        clientId: "1038594593085.apps.googleusercontent.com",
        redirectURL: "http://localhost:9000/redirector.html",
        authEndpoint: "https://accounts.google.com/o/oauth2/auth",
        scopes: "https://www.googleapis.com/auth/drive"
    }
});

pipeline = AeroGear.Pipeline( { authorizer: authz.services.drive } );
pipeline.add([
    {
        name: "files",
        settings: {
            baseURL: "https://www.googleapis.com/drive/v2/"
        }
    }
]);

filesPipe = pipeline.pipes.files;

function validateResponse( responseFromAuthEndpoint, callback ) {
    authz.services.drive.validate( responseFromAuthEndpoint,{
        success: function( response ) {
            $( ".topcoat-notification.errors" ).hide();
            console.log( response );
            $( "#dance" ).attr( "disabled", "disabled" );
            callback();
        },
        error: function( error ) {
            console.log( error );
        }
    });
}

function dance( authURL, callback ) {
    //console.log( authURL );
    //console.log( "Opening Auth URL" );
    authWindow = window.open( authURL );
    //Watch the window for the location to change
    timer = setInterval( function() {
        if( authWindow.closed ) {
            clearInterval( timer );
            //console.log( "Child Window has closed" );
            return;
        }

        if( authWindow.location.href || authWindow.location.origin ) {
            //console.log( "redirect URL is back in the child" );
            clearInterval( timer );
            //console.log( "About to validate response returned" );
            validateResponse( authWindow.location.href, callback );
            authWindow.close();
        }

        //If the window is closed,  clear the interval
        if( authWindow.closed ) {
            clearInterval( timer );
            //console.log( "Child Window has closed" );
        }
    }, 500 );
}

function readFilesPipe() {
    $("ul.topcoat-list__container").empty();
    $( ".topcoat-notification.loading" ).show();
    filesPipe
        .read()
        .then( function( response ){
            var putItHere = $("ul.topcoat-list__container"),
                items = response.items,
                itemLength = items.length,
                item,
                i;

            for( i = 0; i < itemLength; i++ ) {
                item = items[ i ];
                putItHere.append( "<li class='topcoat-list__item'><img src='" + item.iconLink + "'> " + item.title );
            }
        })
        .then( null, function( error ) {
            $( "#dance" ).removeAttr( "disabled" );
            authURL = error.authURL;
            callback = readFilesPipe;
            $( ".topcoat-notification.errors" ).show();
        })
        .always( function() {
            $( ".topcoat-notification.loading" ).hide();
        });
}


$( "#list_files" ).on( "click", function() {
    readFilesPipe();
});

$( "#dance" ).on( "click", function( events ) {
    var targetValue = events.target.checked;
    if( targetValue ) {
        dance( authURL, callback );
    }
});
