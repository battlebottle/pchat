/// <reference path="core.ts" />
var HTMLTemplates;
(function (_HTMLTemplates) {
    var HTMLTemplates = (function () {
        function HTMLTemplates() {
        }
        HTMLTemplates.innerContentDiv_Video = function () {
            var contentDiv = '<div style="margin-top:5px;">\
			    			<img width="20" height="20" class="" src="https://pbs.twimg.com/profile_images/414219711803432960/VfrkHfhF_normal.png" alt="" style="vertical-align: middle;">	\
			    			<span class="" style="font-weight:bold;font-size:12px;">YouTube</span>' + '</div>\
			    		<div class="CardContent" style="margin-top:5px;">\
            				<div class="PlayerCard">\
      							<div class="Box">\
  									<div id="ExternalIframeContainer" class="FlexEmbed" data-iframe-height="281" data-iframe-width="500" style="height:281px;background-color:green;">\
    									<!--<iframe src="https://www.youtube.com/embed/YISBPq1NjLQ" frameborder="0" scrolling="no" allowtransparency="true" style="width:100%;height:100%;"></iframe>!-->\
  									</div>\
								</div>\
        						<h1 class="embeddedContentTitle">\
    								<a class="embeddedContentTitle" href="http://t.co/3OJEmceqnI">Brian! Robinson eager to change fortunes</a>\
  								</h1>      \
      							<p class="Description u-textBreak">\
  									<a class="embeddedContentText" href="http://t.co/3OJEmceqnI">\
    								Manager Karl Robinson talks to MK Dons Player about his desire to turn things around and his plans for the 	final two days of the transfer window.\
  									</a>\
								</p>\
    						</div>\
      					</div>';
            return contentDiv;
        };

        HTMLTemplates.innerContentDiv_Drawing = function (imageData) {
            console.log("innerContentDiv_Drawing: " + imageData.length);
            var contentDiv = '<div class="NormalCard">\
            					<img width="450" height="450" src="#srcData">\
    						</div>';
            var byteArrayTobase64 = function (data) {
                return btoa(String.fromCharCode.apply(null, data));
            };
            var base64string = byteArrayTobase64(imageData);

            return contentDiv.replace('#srcData', 'data:image/png;base64,' + base64string);
        };

        HTMLTemplates.messageDiv = function (name, message, thumnbnail, extraMedia) {
            var html = '<div  class="messageDiv">\
            	<div class="innerMessageDiv">\
			    	<div  class="nameDiv">\
				    	<span>#name</span>\
			    	</div>\
			    	<div class="#messContentDiv" id="content">\
			    		<img class="thumbnailImg" style="width:#thumbSizepx;height:#thumbSizepx;background-color: black;float:left; margin-right:5px; margin-bottom:5px;border:0px;">\
				    	<span>#message</span>\
			    	</div>\
			    	<div class="expandedContentDiv" style="overflow: hidden;">\
                    #contentDivHTML\
					</div>\
				#clickToExpandDiv\
        	</div>\
		</div>';

            var clickToExpandDiv = '<div class="clickToExpandDiv">Click to expand</div>';

            var stringIf = function (condition, trueString, falseString) {
                if (condition) {
                    return trueString;
                } else {
                    return falseString;
                }
            };

            return html.replace('#name', name).replace('#message', message).replace('#contentDivHTML', "").replace('#clickToExpandDiv', stringIf(extraMedia, clickToExpandDiv, "")).replace('#thumbSize', stringIf(thumnbnail, "100", "0")).replace('#messContentDiv', stringIf(thumnbnail, "messageContentDiv", ""));
        };
        return HTMLTemplates;
    })();
    _HTMLTemplates.HTMLTemplates = HTMLTemplates;
})(HTMLTemplates || (HTMLTemplates = {}));
//# sourceMappingURL=HTMLTemplates.js.map
