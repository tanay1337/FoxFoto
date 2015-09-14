/* Javascript file for app */

"use strict";

// Some varibles that are used globally throughout the file but untimately it is in local scope
var localVar = {
                userLocation:null,    // to store user's location
                imgCounter:0,         // to get no. of images picked by user
                imgurLink:null,       // to store latest imgur link returned after uploading
                db:null,              // to store indexedDB object
                canvasHeight:null,    // to store total canvas height 
                image:{             
                  img:[]              // array to store all the image object selected for collage
                }, 
                tmp:1,                // just a tmp. variable
                lastLoc:0             
};

( function(){
  // hides unnecessary elements
  $('#backBtn').hide();
  $('section.collageSection').hide();
  $('section.editImageSection').hide();
  $('#actionBtns').hide();
  $('#actionBtns2').hide();
  $('section.previousEdited').hide();
  $('#wantLocationBtn').bootstrapSwitch({size:'mini',onText:'<i class="fa fa-check"></i>',offText:'<i class="fa fa-times"></i>'});
  
  // Setting options for Geolocation
  var options = {
                  enableHighAccuracy: true,
                  timeout: 5000,
                  maximumAge: 0
  };

  // Geolocation API call
  navigator.geolocation.getCurrentPosition(locationSuccess, locationError, options);
  
  // Call to initialize the DB 
  fireDB();
  
  // function to call 
  attachEventsToAll();

}() );


// function is called if location is fetched successfully
function locationSuccess(pos) {
                
  var crd = pos.coords;
  var latlon = crd.latitude + "," + crd.longitude;

  // google maps call
  var img_url = "http://maps.googleapis.com/maps/api/staticmap?center="+latlon+"&zoom=14&size=150x149&sensor=false";
  
  // creating image object to store static map returned by Google maps
  localVar.userLocation = new Image();
  localVar.userLocation.crossOrigin = "Anonymous";    // enables CORS (cross-origin resource sharing)
  
  // setting "src" attribute to image returned by google maps
  localVar.userLocation.src = img_url;
}


// function is called Location is not fetched.
function locationError(err) {
                
  console.warn('Location error: ' + err.code + ' : ' + err.message);
     
}

// Initializes the DB
function fireDB(){

  var request = indexedDB.open('linksDB', 1);
 
  request.onsuccess = function (e) {
    // e.target.result has the connection to the database
    localVar.db = request.result;
  };
  request.onerror  = function( e){

    console.log('Error '+e.value)
  }

  // if version change occurs
  request.onupgradeneeded = function (e) {
    
    // e.target.result holds the connection to database
    localVar.db = e.target.result;

    if ( localVar.db.objectStoreNames.contains("links") ) {
      // deletes objectStore of previous version and creates a new one
      localVar.db.deleteObjectStore("links");
     
    }
   
    var objectStore = localVar.db.createObjectStore('links', { keyPath: 'id', autoIncrement: true });
 
  };

  return true;
}


// Function attaches events to required elements.
function attachEventsToAll(){

  // create collage at home screen
  $('#createCollageBtn').on('click', function(){

    $('section.btnContainer').removeClass('animated bounceInLeft').hide();
    $('section.collageSection').addClass('animated bounceInRight').show();
    $('#pickImage').html('Pick Fotos (at least 2)').show();
    $('.locationSwitch').show();
    $('#imgDisplay').html('');
    $('#backBtn').addClass('inCollage animated bounceInRight').show();
    $('#createCollage').hide();
    $('#actionBtns').hide();
    
    // clearing canvas for re-drawing
    var myCanvas = document.getElementById('displayCanvas');
    var ctx = myCanvas.getContext('2d');
    ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
      
    // initially hides the canvas and display only after when use picks at least 2 image
    $(myCanvas).hide();
    
    // sets localVar.imgCounter and other variables to initial value 0 on every time user clicks on this button
    localVar.imgCounter = 0;
    localVar.image.img = [];
    localVar.tmp = 1;


  });
  

  // edit image button on home screen 
  $('#editPhoto').on('click', function(){

    // display and hide buttons
    $('section.btnContainer').removeClass('animated bounceInLeft').hide();
    $('section.editImageSection').addClass('animated bounceInRight').show();
    $('#effectBtns').hide();
    $('#backBtn').addClass('inEdit animated bounceInRight').show();
      
    // clearing canvas for redrawing
    var myCanvas = document.getElementById('displayCanvasForEdit');
    var ctx = myCanvas.getContext('2d');
    ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
      
    // initially hides the canvas and display after when use picks an image
    $(myCanvas).hide();
      
  });

  // back btn
  $('#backBtn').on('click', function(){

    // checks whether the back button is pressed from collage section or edit section
    if( $(this).hasClass('inCollage') ){

      $('section.collageSection').removeClass('animated bounceInRight').hide();
      // Hides elements
      $('section.btnContainer').addClass('animated bounceInLeft').show();
      $('#actionBtns').hide();
      $('#backBtn').removeClass('inCollage animated bounceInRight').hide();
    
    }
    else if( $(this).hasClass('inEdit') ){

      $('section.editImageSection').removeClass('animated bounceInRight').hide();
      $('section.btnContainer').addClass('animated bounceInLeft').show();
      $('#actionBtns2').hide();
      $('#backBtn').removeClass('animated bounceInRight').removeClass('inEdit').hide();
  
    }
    else if( $(this).hasClass('inPrevious') ){

      $('section.previousEdited').removeClass('animated bounceInRight').hide();
      $('#backBtn').removeClass('inPrevious animated bounceInRight').hide();
      $('section.btnContainer').addClass('animated bounceInLeft').show();
      
    }

  });
  

  // previous button on home screen
  $('.previousFotos').on('click', function(){

    // hides and display required elements
    $('section.btnContainer').removeClass('animated bounceInLeft').hide();
    $('section.previousEdited').addClass('animated bounceInRight').show();
    $('#backBtn').addClass('inPrevious animated bounceInRight').show();

    // call view previous function in which whole logic of displaying the previous images is present
    viewPrevious();
    
  });

  
  // pick image button inside create collage
  $("#pickImage").on('click',function(){
   
    // registering new mozActivity to pick image file of only following type
    var pickImageActivity = new MozActivity({
                                    name: "pick",
                                    data: {
                                          type: ["image/png", "image/jpg", "image/jpeg"]
                                      }
    });


    // if image successfully picked
    pickImageActivity.onsuccess = function() {
        
      
      // creating image object to store image
      var img = new Image();
      img.crossOrigin = "Anonymous"; // enables cross origin resource sharing (CORS)
      
      // loading image with picked up image, image is present in "this.result.blob"
      img.src = window.URL.createObjectURL( this.result.blob );

      // if image loads from that source
      img.onload = function(){
        
        var tmp = localVar.tmp;
        
        // store image in array
        localVar.image.img[tmp-1] = img;
        
        // maintain aspect ratio of image after resizing
        var ratio = ((window.innerWidth - 20)/2) / img.width;
        var height = img.height * ratio;


        $('#imgDisplay').html('<p class="text-center"><strong>You Picked '+tmp+' images</strong>');
        if( tmp===1 ){
          // setting value to variable for first image
          localVar.canvasHeight = height;
        }

        // for image is of second column, 
        else if( tmp%2==0 ){
          // if height of this image is greater than image in first column one of same row
          if( height >= localVar.canvasHeight ){
            // augment .canvasHeight
            localVar.canvasHeight = height;

          }
          

        }

        // else normally increase height 
        // means height of image in first column of each row is added to .canvasHeigt
        else{

          localVar.canvasHeight += height;
        }
        
        localVar.imgCounter++;

        // of users picks at least 2 images
        if( localVar.imgCounter===2 ){
          
          $('#createCollage').show();
        }
        
        localVar.tmp++;

      };

    };

    // if error in picking image from gallery and camera
    pickImageActivity.onerror = function() {
      
      alert("unable to Pick Foto");
      
    };
  
  });

  // Attaching click handler to create Collage button inside Collage Section
  $("#createCollage").on('click',function(){
      
    // initally hides un-neccesary elements
    $('#pickImage').hide();
    $('.locationSwitch').hide();

    
    // get reference to canvas element and display it.

    var myCanvas = document.getElementById("displayCanvas");
    $(myCanvas).show();
    
    // get total that user selected.
    var totalImages = localVar.image.img.length;
    
    // checks if user turned location "on"
    if( $('#wantLocationBtn').is(":checked") && localVar.userLocation ){

      localVar.image.img[totalImages] = localVar.userLocation;
      totalImages++;
      
      if( localVar.tmp%2!==0 && localVar.tmp>1){
        localVar.canvasHeight += localVar.userLocation.height;
        localVar.lastLoc = 1;
      }
      
      

    }    

    // styling canvas
    myCanvas.width = 300;
    myCanvas.height = localVar.canvasHeight;
    myCanvas.style.background = "RGB(248,248,248)";
    
    // getting context of canvas
    var ctx = myCanvas.getContext('2d');

    // setting some variables to their initial values
    var offsetX = 0;
    var offsetY = 0;
    var tmpHeight = 0;
    var firstColHeight = 0;
    var secondColHeight = 0;

    for( var i=0;i<totalImages;i++ ){

      var img = localVar.image.img[i];
      
      // to maintain aspect ratio of image.
      var ratio = (myCanvas.width/2) / img.width;
      var height = img.height * ratio;
      


      var tmp = i+1;

      // if first image
      if( tmp===1 ){
        offsetX = 0;
        offsetY = 0;
      }
      // if image is in second column
      else if( tmp%2===0 && tmp>1 ){
        // sets offsetX to center of canvas.
        offsetX = myCanvas.width / 2;
      }
      // if image is in first column
      else{
        // sets offsetX to 0 and offsetY will be set according to height of previous first column image 
        offsetX = 0;
        

      }
      
      // drawing of images on canvas after height adjustments
      if( tmp%2===0 && tmp>2 ){
        
        // +5 and -10 is used to provide padding to images
        ctx.drawImage(img, (offsetX+5), (secondColHeight+5), ((myCanvas.width/2)-10), (height-10) );      

      }
      else if( tmp%2!==0 && tmp>2){
        // for making location image span to full width if it is in first column
        if( localVar.lastLoc===1 && (img.src===localVar.userLocation.src) ){
          
          ctx.drawImage(img, (offsetX+5), (firstColHeight+5), ((myCanvas.width)-10), (height-10) );      

        }
        else{
          ctx.drawImage(img, (offsetX+5), (firstColHeight+5), ((myCanvas.width/2)-10), (height-10) );      

        }

      }
      else{

        ctx.drawImage(img, (offsetX+5), (offsetY+5), ((myCanvas.width/2)-10), (height-10))
      }
      
      // store height of first column (that will be used for setting offsetY in next image of same column)
      if(tmp%2!==0){
        firstColHeight = height; 
      }
      else{
        secondColHeight = height;

      }

      

    }
  
    // dispaly button set after successful drawing of canvas
    $('#actionBtns').show();
    $('#createCollage').hide();
    
    // attaching event handler to delete button 
    $('#deleteCollage').on('click',function(event) {
      
      /* reseting all the things to create revert effect */
      
      $('#imgDisplay').html('');
      $('#actionBtns').hide();

      localVar.imgCounter = 0;  
      
      var myCanvas = document.getElementById('displayCanvas');
      var ctx = myCanvas.getContext('2d');
      ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
      $(myCanvas).hide();
      
      localVar.canvasHeight = 0;
      localVar.image.img = [];
      localVar.tmp = 1;
      
      $('#pickImage').show();
      $('.locationSwitch').show();
    
    });

    
    // makgin canvas downloadable
    $('#toLocal').on('click', function(){

              // to get base64 encoded URL of image. 
              var dataURL = document.getElementById('displayCanvas').toDataURL('image/png');
              
              // setting href attribute of link to URL of canvas
              $(this).attr('href', dataURL);
                
              // get random name for image which user downloads.
              var randName = getRandName();

              // set download attribute of link to name of image, this makes image download instead of follwing link.
              $(this).attr('download',randName);
    });

    // uploading image in imgur
    $('#toImgur').on('click', function(){

        // base64 encoded URL of canvas    
        var image = document.getElementById('displayCanvas').toDataURL('image/png', 0.9).split(',')[1];
                
        //imgur JS v3 API
        $.ajax({
          
          url: 'https://api.imgur.com/3/image',
          type: 'post',
          headers: { 
            Authorization: 'Client-ID c5efa529430990f'      // this varies for you, 
                                                            // register yourself at imgur.com get yourself a differnt secret and ID
          },
          data: {
            image: image
          },
          dataType: 'json',
          beforeSend:function(){

            $('#toImgur').html('<i class="fa fa-circle-o-notch fa-spin"></i>');
          },
          success: function(response) {
              
              if(response.success) {
                localVar.imgurLink = response.data.link;
                // this function saves link in indexedDB for future reference
                savelink();
                
              }
          },
          error:function( e ){
            $('#toImgur').html('<i class="fa fa-cloud"></i>')
            console.log('Error '+e.responseText);
          }

        });


    });

  
  
  });

  // Edit image.
  $("#pickImageForEdit").on('click',function(){
    
    // registering new mozActivity to pick image file
    var pickImageActivity = new MozActivity({
                                    name: "pick",
                                    data: {
                                          type: ["image/png", "image/jpg", "image/jpeg"]
                                      }
    });

    // if image successfully picked
    pickImageActivity.onsuccess = function() {
             
      $('#pickImageForEdit').html('New Foto');
      
      var myCanvas = document.getElementById("displayCanvasForEdit");
      
      // displays initially hidden canvas
      $(myCanvas).show();
      var ctx = myCanvas.getContext('2d');

      // styling canvas
      myCanvas.width = window.innerWidth - 30;
      myCanvas.style.background = "RGB(248,248,248)";
      ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
      
      var img = new Image();
      
      // loading image with picked up image
      img.src = window.URL.createObjectURL( this.result.blob );

      img.onload = function(){

        ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
        
        // maintainintain aspect ratio
        var ratio = myCanvas.width / img.width;
        var height = img.height * ratio;

        myCanvas.height = height;
        
        ctx.drawImage(img, 5, 5, (myCanvas.width-10), (height-10));

        // displaying buttons
        $('#effectBtns').show();
        //$('#actionBtns2').show();  
        
        // attaching events to buttons inside image edit section.
        $('#grayEffect').click(function(){
          revert(img, height);
          grayscale(height);
        
        });
       
        $('#sepiaEffect').on('click',function(){
          
          revert(img, height);
          sepia(height);
        });
        
        $('#blurEffect').on('click',function(){
          revert(img, height);
          blurImage(img, height);
        });
        
        $('#invertEffect').on('click',function(){
          revert(img, height);
          invert(height);
        });
        $('#revert').on('click', function(){

          revert(img,height);

        });

        // for sharing and downloding options

        $('#toLocalAfterEdit').on('click', function(){

            // to get base64 encoded URL of image. 
            var dataURL = document.getElementById('displayCanvasForEdit').toDataURL('image/png');
            $(this).attr('href', dataURL);
            
            var randName = getRandName();
            $(this).attr('download',randName);
        });

        $('#toImgurAfterEdit').on('click', function(){

          
          var image = document.getElementById('displayCanvasForEdit').toDataURL('image/png', 0.9).split(',')[1];
                  
          //imgur API
          $.ajax({
            
            url: 'https://api.imgur.com/3/image',
            type: 'post',
            headers: { 
              Authorization: 'Client-ID c5efa529430990f'
            },
            data: {
              image: image
            },
            dataType: 'json',
            beforeSend:function(){

              $('#toImgurAfterEdit').html('<i class="fa fa-circle-o-notch fa-spin"></i>');
            },
            success: function(response) {
                
                if(response.success) {
                  
                  localVar.imgurLink = response.data.link;
                  savelink();
                  
                }
            },
            error:function( e ){

              console.log('Error '+e.responseText);
            }

          });


        });

      };

    };

    pickImageActivity.onerror = function() {
      
      alert("unable to Pick Image");
      
    };
  
    

  
  });

  
  // share button inside view previous, it is used to share link via email and other third-party app installed
  $(document).on('click','.shareBtn', function(){
     
     new MozActivity({
          name: "share",
          data: {
              number: 1,
              url: localVar.imgurLink   // Url of image which you want to share, we have used latest imgur link that user got.
          }
      });

  });
  



  return true;
} // attachEventToElements ends here



// grayscale effect
function grayscale(height){

  var myCanvas = document.getElementById('displayCanvasForEdit');
  var ctx = myCanvas.getContext('2d');

  // retrieving pixel data of image
  var imageData = ctx.getImageData(5, 5, (myCanvas.width-10), (height-10) );
  var data = imageData.data;

  for(var i = 0; i < data.length; i += 4) {
    
    var r = data[i];  // red
    var g = data[i + 1]; // green
    var b = data[i + 2]; // blue

    // sets R,G,B to average value, this concept is used for Grayscale effect
    data[i] = data[i + 1] = data[i + 2] = (r+g+b)/3;
  }

  // clearing canvas to avoid any anomaly
  ctx.clearRect(0,0,myCanvas.width,myCanvas.height);
  // overwrite original image
  ctx.putImageData(imageData, 5, 5 );
  
  return true;
}


// Sepia effect
function sepia(height){

  var myCanvas = document.getElementById('displayCanvasForEdit');
  var ctx = myCanvas.getContext('2d');


  // retrieving pixel data of image
  var imageData = ctx.getImageData(5, 5, (myCanvas.width-10), (height-10) );
  var data = imageData.data;

  for(var i = 0; i < data.length; i += 4) {
   
    var r = data[i];
    var g = data[i + 1];
    var b = data[i + 2];
    data[i]     = (r * 0.393)+(g * 0.769)+(b * 0.189); // red
    data[i + 1] = (r * 0.349)+(g * 0.686)+(b * 0.168); // green
    data[i + 2] = (r * 0.272)+(g * 0.534)+(b * 0.131); // blue
  }

  ctx.clearRect(0,0,myCanvas.width,myCanvas.height);

  // overwrite original image
  ctx.putImageData(imageData, 5, 5);
  
  return true;
}


// blur effect
function blurImage(img, height){

  
  var myCanvas = document.getElementById('displayCanvasForEdit');
  var ctx = myCanvas.getContext('2d');

  // for blurring we overlay 20 instances of same images over original and get blurred effect without using any Algorithms.
  var counter =  16;
  ctx.globalAlpha = 0.125;
  // Loop for each blur pass.
  ctx.clearRect(0,0,myCanvas.width,myCanvas.height);

  for (var i = 1; i <= counter; i++) {
    for (var y = -1; y < 4; y++) {
      for (var x = -1; x < 4; x++) {
          
          ctx.drawImage(img, (x+6), (y+6), (myCanvas.width-14),(height-14) );
      }
    }
  }
  
  ctx.globalAlpha = 1.0;
  return true;
}


// Invert effect
function invert(height){

  var myCanvas = document.getElementById('displayCanvasForEdit');
  var ctx = myCanvas.getContext('2d');

  var imageData = ctx.getImageData(5, 5, (myCanvas.width-10), (height-10) );
  var data = imageData.data;

  for(var i = 0; i < data.length; i += 4) {
    
    data[i] = 255 - data[i];  // red
    data[i + 1] = 255 - data[i+1];  // green
    data[i + 2] = 255 - data[i+2]; // blue
  }
  ctx.clearRect(0,0,myCanvas.width,myCanvas.height);

  // overwrite original image
  ctx.putImageData(imageData, 5, 5);
  
  return true;
}


// reverting changes
function revert(img,height){

  var myCanvas = document.getElementById('displayCanvasForEdit');
  var ctx = myCanvas.getContext('2d');

  // Draw original image once again
  ctx.drawImage(img, 5, 5, (myCanvas.width-10),(height-10) );

  return true;
}


// Generates Random name for image.
function getRandName(){


  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 5; i++ ){
    
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  }
  
  return "FoxFoto_"+text+".png";


}


// Save igur link in indexedDb
function savelink(){

  var link = localVar.imgurLink;
  
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!

  var yyyy = today.getFullYear();
  
  if(dd<10){
        
    dd='0'+dd;
  } 
  if(mm<10){
    
    mm='0'+mm;
  } 
  var date = dd+'/'+mm+'/'+yyyy;
 
  var link = {'link':localVar.imgurLink, 'date':date};

  var transaction = localVar.db.transaction([ 'links' ], 'readwrite');
  // add the note to the store
  var store = transaction.objectStore('links');
  
  var request = store.add(link);
  
  request.onsuccess = function (e) {
    
    alert('Image saved');
    $('#toImgurAfterEdit').html('<i class="fa fa-cloud"></i>');
    $('#toImgur').html('<i class="fa fa-cloud"></i>');
  };
 
  request.onerror = function (e) {
    
    alert("Error in saving the note. Reason : " + e.value);
  };

}


// function to view previously edited fotos
function viewPrevious(){

    // empty list
    $('.prevListings ul').html('');

    var objectStore = localVar.db.transaction("links").objectStore("links");
    
    // creating cursor to walk through all stored entries
    objectStore.openCursor().onsuccess = function(event) {

      var cursor = event.target.result;

      if (cursor) {

        // creates "li" elements diaplying image, link and share button 
        $('.prevListings ul').append('<li class="list"><img class="img-thumbnail img-responsive" width="60" height="60" src="'+cursor.value.link+'">&nbsp;<small><i class="fa fa-link"></i> '+(cursor.value.link)+'</small>&nbsp;<button class="btn btn-sm btn-action shareBtn"><i class="fa fa-share-alt"></i></button></li>');

        // next entry
        cursor.continue();
      
      }
    
    };
}




